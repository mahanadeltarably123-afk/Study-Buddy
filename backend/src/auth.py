from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from src.database import get_db
from src.models import User
import os

# We will receive the token from the frontend in the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

def verify_google_token(token: str):
    try:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        return idinfo
    except ValueError:
        return None

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verify_google_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    google_id = payload.get("sub")
    user = db.query(User).filter(User.google_id == google_id).first()
    
    if not user:
        # Create new user if not exists
        user = User(
            google_id=google_id,
            email=payload.get("email"),
            name=payload.get("name"),
            profile_picture=payload.get("picture")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user
