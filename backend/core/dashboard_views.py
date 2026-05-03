from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Task, Project, Membership
from .serializers import TaskSerializer


class DashboardViewSet(viewsets.ViewSet):
    """Dashboard summary and analytics endpoints."""
    permission_classes = [permissions.IsAuthenticated]

    def _get_user_tasks(self, user):
        """Get all tasks in projects the user owns or is a member of."""
        owned_projects = Project.objects.filter(owner=user)
        member_projects = Project.objects.filter(memberships__user=user)
        user_projects = (owned_projects | member_projects).distinct()
        return Task.objects.filter(project__in=user_projects).distinct()

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get dashboard summary for the current user.
        
        Admins see all tasks in their projects.
        Members see only tasks assigned to them.
        """
        user = self.request.user
        
        # Get all user's projects with their roles
        owned_projects = Project.objects.filter(owner=user)
        memberships = Membership.objects.filter(user=user).select_related('project')
        
        # Build tasks queryset based on role
        task_ids = []
        for project in owned_projects:
            # User is owner: see all tasks
            task_ids.extend(Task.objects.filter(project=project).values_list('id', flat=True))
        
        for membership in memberships:
            if membership.role == 'admin':
                # User is admin: see all tasks in project
                task_ids.extend(Task.objects.filter(project=membership.project).values_list('id', flat=True))
            else:
                # User is member: see only assigned tasks
                task_ids.extend(Task.objects.filter(project=membership.project, assignee=user).values_list('id', flat=True))
        
        user_tasks = Task.objects.filter(id__in=set(task_ids)).distinct()
        
        total_tasks = user_tasks.count()
        completed = user_tasks.filter(status='done').count()
        in_progress = user_tasks.filter(status='in_progress').count()
        todo = user_tasks.filter(status='todo').count()
        
        # Overdue tasks
        today = timezone.now().date()
        overdue = user_tasks.filter(due_date__lt=today, status__in=['todo', 'in_progress']).count()
        
        return Response({
            'total_tasks': total_tasks,
            'completed': completed,
            'in_progress': in_progress,
            'todo': todo,
            'overdue': overdue,
        })

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue tasks for the current user's projects.
        
        Admins see all tasks in their projects.
        Members see only tasks assigned to them.
        """
        user = self.request.user
        today = timezone.now().date()
        
        # Get tasks based on role
        owned_projects = Project.objects.filter(owner=user)
        memberships = Membership.objects.filter(user=user).select_related('project')
        
        task_ids = []
        for project in owned_projects:
            task_ids.extend(Task.objects.filter(project=project).values_list('id', flat=True))
        
        for membership in memberships:
            if membership.role == 'admin':
                task_ids.extend(Task.objects.filter(project=membership.project).values_list('id', flat=True))
            else:
                task_ids.extend(Task.objects.filter(project=membership.project, assignee=user).values_list('id', flat=True))
        
        user_tasks = Task.objects.filter(id__in=set(task_ids)).distinct()
        
        overdue_tasks = user_tasks.filter(
            due_date__lt=today,
            status__in=['todo', 'in_progress']
        ).select_related('project', 'assignee', 'created_by').order_by('due_date')
        
        return Response(TaskSerializer(overdue_tasks, many=True).data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming tasks (due in next 7 days) in the current user's projects.
        
        Admins see all tasks in their projects.
        Members see only tasks assigned to them.
        """
        user = self.request.user
        today = timezone.now().date()
        next_week = today + timedelta(days=7)
        
        # Get tasks based on role
        owned_projects = Project.objects.filter(owner=user)
        memberships = Membership.objects.filter(user=user).select_related('project')
        
        task_ids = []
        for project in owned_projects:
            task_ids.extend(Task.objects.filter(project=project).values_list('id', flat=True))
        
        for membership in memberships:
            if membership.role == 'admin':
                task_ids.extend(Task.objects.filter(project=membership.project).values_list('id', flat=True))
            else:
                task_ids.extend(Task.objects.filter(project=membership.project, assignee=user).values_list('id', flat=True))
        
        user_tasks = Task.objects.filter(id__in=set(task_ids)).distinct()
        
        upcoming_tasks = user_tasks.filter(
            due_date__gte=today,
            due_date__lte=next_week,
            status__in=['todo', 'in_progress']
        ).select_related('project', 'assignee', 'created_by').order_by('due_date')
        
        return Response(TaskSerializer(upcoming_tasks, many=True).data)
