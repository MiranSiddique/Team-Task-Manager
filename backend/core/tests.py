from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Project, Membership

User = get_user_model()


class RegisterViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'

    def test_register_user_success(self):
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'securepassword123'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_register_user_short_password(self):
        data = {
            'username': 'testuser2',
            'email': 'test2@example.com',
            'password': 'short'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_username(self):
        User.objects.create_user(username='existing', email='existing@example.com', password='pass')
        data = {
            'username': 'existing',
            'email': 'new@example.com',
            'password': 'securepassword123'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TokenViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.token_url = '/api/auth/token/'
        self.user = User.objects.create_user(
            username='tokenuser',
            email='tokenuser@example.com',
            password='testpass123'
        )

    def test_obtain_token_success(self):
        data = {
            'username': 'tokenuser',
            'password': 'testpass123'
        }
        response = self.client.post(self.token_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_obtain_token_wrong_password(self):
        data = {
            'username': 'tokenuser',
            'password': 'wrongpass'
        }
        response = self.client.post(self.token_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProjectJoinViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='testpass123'
        )
        self.member = User.objects.create_user(
            username='member',
            email='member@example.com',
            password='testpass123'
        )
        self.public_project = Project.objects.create(
            name='Public project',
            description='Open to all authenticated users',
            owner=self.owner,
            is_private=False,
        )
        self.private_project = Project.objects.create(
            name='Private project',
            description='Invite-only',
            owner=self.owner,
            is_private=True,
        )
        Membership.objects.create(user=self.owner, project=self.public_project, role='admin')
        Membership.objects.create(user=self.owner, project=self.private_project, role='admin')
        self.join_url_public = f'/api/projects/{self.public_project.id}/join/'
        self.join_url_private = f'/api/projects/{self.private_project.id}/join/'

    def test_authenticated_user_can_join_public_project(self):
        self.client.force_authenticate(user=self.member)

        response = self.client.post(self.join_url_public, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'member')
        self.assertTrue(Membership.objects.filter(user=self.member, project=self.public_project).exists())

    def test_authenticated_user_cannot_join_private_project_directly(self):
        self.client.force_authenticate(user=self.member)

        response = self.client.post(self.join_url_private, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Membership.objects.filter(user=self.member, project=self.private_project).exists())

    def test_owner_can_call_join_and_keeps_admin_membership(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(self.join_url_private, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'admin')
        self.assertTrue(Membership.objects.filter(user=self.owner, project=self.private_project, role='admin').exists())


class ProjectAssigneesViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='testpass123'
        )
        self.admin_member = User.objects.create_user(
            username='admin_member',
            email='admin@example.com',
            password='testpass123'
        )
        self.regular_member = User.objects.create_user(
            username='regular_member',
            email='member@example.com',
            password='testpass123'
        )
        self.project = Project.objects.create(
            name='Test Project',
            description='For testing assignees',
            owner=self.owner,
            is_private=False,
        )
        Membership.objects.create(user=self.owner, project=self.project, role='admin')
        Membership.objects.create(user=self.admin_member, project=self.project, role='admin')
        Membership.objects.create(user=self.regular_member, project=self.project, role='member')

    def test_get_assignees_list_for_project(self):
        self.client.force_authenticate(user=self.owner)
        
        response = self.client.get(f'/api/projects/{self.project.id}/assignees/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)  # owner + 2 members
        
        usernames = [user['username'] for user in response.data]
        self.assertIn('owner', usernames)
        self.assertIn('admin_member', usernames)
        self.assertIn('regular_member', usernames)

    def test_member_can_get_assignees_list(self):
        self.client.force_authenticate(user=self.regular_member)
        
        response = self.client.get(f'/api/projects/{self.project.id}/assignees/', format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
