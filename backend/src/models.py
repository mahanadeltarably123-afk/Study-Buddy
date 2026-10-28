from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    profile_picture = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lectures = relationship("Lecture", back_populates="owner")
    workspaces = relationship("Workspace", back_populates="owner")

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    color = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="workspaces")

class Lecture(Base):
    __tablename__ = "lectures"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    # Store the full StudyContent object as JSON
    data = Column(JSON) 
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="lectures")
