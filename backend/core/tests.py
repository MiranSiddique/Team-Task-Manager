from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

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
