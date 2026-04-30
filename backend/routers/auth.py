from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from auth_utils import hash_password, verify_password, create_access_token
from storage import get_users, save_users

router = APIRouter()


class AuthRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
def login(body: AuthRequest):
    users = get_users()
    user = users.get(body.username)
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return TokenResponse(access_token=create_access_token(body.username))


@router.post("/register", response_model=TokenResponse)
def register(body: AuthRequest):
    if len(body.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(body.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")
    users = get_users()
    if body.username in users:
        raise HTTPException(status_code=400, detail="Username already taken")
    users[body.username] = {
        "username": body.username,
        "hashed_password": hash_password(body.password),
    }
    save_users(users)
    return TokenResponse(access_token=create_access_token(body.username))
