from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from authentication.models import User  

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token.get("user_id")
            user = User.objects.get(id=user_id)
            user.is_authenticated = True
            return user
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found.", code="user_not_found")