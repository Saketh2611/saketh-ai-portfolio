"""
Pydantic schemas — the API's request/response contract.

Kept separate from app/models/orm.py on purpose: the ORM describes what's
in the database, these describe what crosses the wire. They usually look
similar but shouldn't be the same class — e.g. ProjectCreate doesn't have
an `id`, ProjectOut doesn't accept `full_description` writes directly.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# --- Profile ---

class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: str
    headline: str
    summary: str
    photo_url: str | None
    resume_pdf_url: str | None
    email: str | None
    github_url: str | None
    linkedin_url: str | None
    phone: str | None
    location: str | None


class ProfileUpdate(BaseModel):
    """All fields optional — admin can update one field at a time (e.g. just headline)."""
    full_name: str | None = None
    headline: str | None = None
    summary: str | None = None
    email: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    phone: str | None = None
    location: str | None = None


# --- Projects ---

class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    github_url: str | None
    live_url: str | None
    short_description: str
    tech_stack: list[str]
    display_order: int


class ProjectDetailOut(ProjectOut):
    """Includes full_description — used on a project detail view, not the list card."""
    full_description: str
    created_at: datetime


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    github_url: str | None = None
    live_url: str | None = None
    short_description: str = Field(..., max_length=300)
    full_description: str = Field(..., min_length=1)
    tech_stack: list[str] = Field(default_factory=list)
    display_order: int = 0


class ProjectUpdate(BaseModel):
    """All optional — partial update. If full_description changes, the
    service layer re-chunks and re-embeds; that's the one field where a
    PUT costs real compute, not just a row update."""
    title: str | None = None
    github_url: str | None = None
    live_url: str | None = None
    short_description: str | None = None
    full_description: str | None = None
    tech_stack: list[str] | None = None
    display_order: int | None = None


# --- Chat ---

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)


class ChatSource(BaseModel):
    title: str
    url: str | None = None
    source_type: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]


# --- Admin auth ---

class AdminLoginRequest(BaseModel):
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Resume text (admin pastes summary/sections that get embedded) ---

class ResumeSectionCreate(BaseModel):
    section_title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)
