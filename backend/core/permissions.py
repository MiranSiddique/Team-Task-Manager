from rest_framework import permissions
from .models import Membership, Project, Task


class IsProjectMember(permissions.BasePermission):
    """Allow access if user is a member of the project (or owner)."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # If object is a Project
        if isinstance(obj, Project):
            if obj.owner_id == user.id:
                return True
            return Membership.objects.filter(project=obj, user=user).exists()

        # If object is a Task, check task.project
        if isinstance(obj, Task):
            project = obj.project
            if project.owner_id == user.id:
                return True
            return Membership.objects.filter(project=project, user=user).exists()

        return False


class IsProjectAdmin(permissions.BasePermission):
    """Allow only project admins (or owner) to perform certain actions."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if isinstance(obj, Project):
            if obj.owner_id == user.id:
                return True
            return Membership.objects.filter(project=obj, user=user, role='admin').exists()

        if isinstance(obj, Task):
            project = obj.project
            if project.owner_id == user.id:
                return True
            return Membership.objects.filter(project=project, user=user, role='admin').exists()

        return False
