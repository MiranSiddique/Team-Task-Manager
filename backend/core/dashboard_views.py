from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Task
from .serializers import TaskSerializer


class DashboardViewSet(viewsets.ViewSet):
    """Dashboard summary and analytics endpoints."""
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get dashboard summary for the current user."""
        user = self.request.user
        
        # User's tasks
        assigned_tasks = Task.objects.filter(assignee=user)
        
        total_tasks = assigned_tasks.count()
        completed = assigned_tasks.filter(status='done').count()
        in_progress = assigned_tasks.filter(status='in_progress').count()
        todo = assigned_tasks.filter(status='todo').count()
        
        # Overdue tasks
        today = timezone.now().date()
        overdue = assigned_tasks.filter(due_date__lt=today, status__in=['todo', 'in_progress']).count()
        
        return Response({
            'total_tasks': total_tasks,
            'completed': completed,
            'in_progress': in_progress,
            'todo': todo,
            'overdue': overdue,
        })

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue tasks for the current user."""
        user = self.request.user
        today = timezone.now().date()
        
        overdue_tasks = Task.objects.filter(
            assignee=user,
            due_date__lt=today,
            status__in=['todo', 'in_progress']
        ).select_related('project', 'assignee', 'created_by').order_by('due_date')
        
        return Response(TaskSerializer(overdue_tasks, many=True).data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming tasks (due in next 7 days)."""
        user = self.request.user
        today = timezone.now().date()
        next_week = today + timedelta(days=7)
        
        upcoming_tasks = Task.objects.filter(
            assignee=user,
            due_date__gte=today,
            due_date__lte=next_week,
            status__in=['todo', 'in_progress']
        ).select_related('project', 'assignee', 'created_by').order_by('due_date')
        
        return Response(TaskSerializer(upcoming_tasks, many=True).data)
