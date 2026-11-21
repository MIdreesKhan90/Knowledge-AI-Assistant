import os
import jwt

from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv


# Load Environment Variables
load_dotenv()


# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

ALGORITHM = os.getenv(
    "JWT_ALGORITHM",
    "HS256"
)

EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)


# Security Validation
if not SECRET_KEY:
    raise ValueError(
        "JWT_SECRET_KEY is missing from .env"
    )


if ALGORITHM not in ["HS256", "HS384", "HS512"]:
    raise ValueError(
        "Invalid JWT algorithm. Use HS256, HS384 or HS512."
    )


if len(SECRET_KEY.encode("utf-8")) < 32:
    raise ValueError(
        "JWT_SECRET_KEY must contain at least 32 bytes."
    )


if EXPIRE_MINUTES <= 0:
    raise ValueError(
        "ACCESS_TOKEN_EXPIRE_MINUTES must be greater than 0."
    )


# Create Access Token
def create_access_token(user_id: int) -> str:

    now = datetime.now(timezone.utc)

    expire = now + timedelta(
        minutes=EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": expire
    }

    access_token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return access_token