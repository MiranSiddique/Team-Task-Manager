from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .models import Project, Task, Membership
from .serializers import ProjectSerializer, TaskSerializer, MembershipSerializer
from .permissions import IsProjectMember, IsProjectAdmin

User = get_user_model()


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]

    def get_queryset(self):
        """Return only projects the user owns or is a member of."""
        user = self.request.user
        owned = Project.objects.filter(owner=user)
        member = Project.objects.filter(memberships__user=user)
        return (owned | member).distinct()

    def perform_create(self, serializer):
        """Set the owner to the current user."""
        project = serializer.save(owner=self.request.user)
        Membership.objects.get_or_create(
            user=self.request.user,
            project=project,
            defaults={'role': 'admin'},
        )

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsProjectMember])
    def members(self, request, pk=None):
        """Return memberships for the project."""
        project = self.get_object()
        memberships = Membership.objects.filter(project=project).select_related('user').order_by('user__username')
        serializer = MembershipSerializer(memberships, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsProjectMember])
    def assignees(self, request, pk=None):
        """Return list of users available to assign tasks to (project owner + members)."""
        project = self.get_object()
        # Include project owner and all project members
        member_users = User.objects.filter(
            memberships__project=project
        ) | User.objects.filter(id=project.owner_id)
        member_users = member_users.distinct().order_by('username')
        from .serializers import UserSerializer
        serializer = UserSerializer(member_users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        """Allow the current user to join a public project by id.

        Private projects cannot be joined directly unless the requester is the owner.
        """
        project = get_object_or_404(Project, pk=pk)

        if project.owner_id == request.user.id:
            membership, _ = Membership.objects.get_or_create(
                user=request.user,
                project=project,
                defaults={'role': 'admin'},
            )
            return Response(MembershipSerializer(membership).data)

        if project.is_private:
            return Response(
                {'error': 'Private projects cannot be joined directly'},
                status=status.HTTP_403_FORBIDDEN,
            )

        membership, _ = Membership.objects.get_or_create(
            user=request.user,
            project=project,
            defaults={'role': 'member'},
        )
        if membership.role != 'member':
            membership.role = 'member'
            membership.save(update_fields=['role'])

        return Response(MembershipSerializer(membership).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsProjectMember])
    def leave(self, request, pk=None):
        """Allow a project member to leave the project."""
        project = self.get_object()

        if project.owner_id == request.user.id:
            return Response({'error': 'Project owners cannot leave their own project'}, status=status.HTTP_400_BAD_REQUEST)

        deleted, _ = Membership.objects.filter(project=project, user=request.user).delete()
        if not deleted:
            return Response({'error': 'Membership not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsProjectAdmin])
    def add_member(self, request, pk=None):
        """Add a user to the project with a given role."""
        project = self.get_object()
        username = request.data.get('username')
        role = request.data.get('role', 'member')
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        membership, created = Membership.objects.get_or_create(
            user=user,
            project=project,
            defaults={'role': role}
        )
        
        if not created:
            membership.role = role
            membership.save()
        
        return Response(MembershipSerializer(membership).data)

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated, IsProjectAdmin])
    def remove_member(self, request, pk=None):
        """Remove a user from the project."""
        project = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            membership = Membership.objects.get(project=project, user_id=user_id)
            membership.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Membership.DoesNotExist:
            return Response({'error': 'Membership not found'}, status=status.HTTP_404_NOT_FOUND)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]

    def get_queryset(self):
        """Return only tasks in projects the user is a member of."""
        user = self.request.user
        user_projects = Project.objects.filter(
            memberships__user=user
        ) | Project.objects.filter(owner=user)
        return Task.objects.filter(project__in=user_projects).distinct()

    def perform_create(self, serializer):
        """Set created_by to the current user and validate assignee is a project member."""
        task_data = serializer.validated_data
        project = task_data.get('project')
        assignee = task_data.get('assignee')
        
        # Validate assignee is a project member or owner
        if assignee:
            if project.owner_id != assignee.id:
                membership = Membership.objects.filter(project=project, user=assignee).first()
                if not membership:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError({'assignee_id': 'User is not a member of the project'})
        
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsProjectMember])
    def assign(self, request, pk=None):
        """Assign a task to a user."""
        task = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            assignee = User.objects.get(id=user_id)
            task.assignee = assignee
            task.save()
            return Response(TaskSerializer(task).data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsProjectMember])
    def update_status(self, request, pk=None):
        """Update task status."""
        task = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = dict(Task.STATUS_CHOICES).keys()
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Choose from: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = new_status
        task.save()
        return Response(TaskSerializer(task).data)


class MembershipViewSet(viewsets.ModelViewSet):
    queryset = Membership.objects.all()
    serializer_class = MembershipSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectAdmin]

    def get_queryset(self):
        user = self.request.user
        owned_projects = Project.objects.filter(owner=user)
        member_projects = Project.objects.filter(memberships__user=user)
        return Membership.objects.filter(project__in=(owned_projects | member_projects).distinct()).select_related('user', 'project')
