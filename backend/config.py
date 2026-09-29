from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "mysql+pymysql://root:rootpassword@localhost:3306/vehicle_booking_db"
    secret_key: str = "dev-secret-key-change-me"
    access_token_expire_minutes: int = 120
    algorithm: str = "HS256"
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
