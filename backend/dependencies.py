from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from auth_utils import decode_token

_bearer = HTTPBearer()


def require_auth(credentials: HTTPAuthorizationCredentials = Security(_bearer)) -> str:
    username = decode_token(credentials.credentials)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return username
