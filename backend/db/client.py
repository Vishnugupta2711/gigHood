from supabase import create_client, Client
from backend.config import settings


def _clean_env_value(value: str | None) -> str:
    if not value:
        return ""
    return value.strip().strip('"').strip("'")


def _looks_like_jwt(value: str) -> bool:
    # Supabase anon/service_role keys are JWTs (three dot-separated segments).
    return value.count('.') == 2


def _resolve_supabase_key() -> str:
    """Resolve a valid Supabase key for supabase-py create_client.

    The python client expects anon/service_role JWT-style keys. If a non-JWT
    key is set in a higher-priority env var (for example sb_secret_*), it can
    cause production failures even when a valid anon key is available.
    """
    # Preferred order: service role JWT, anon JWT, then other fallback values.
    jwt_candidates = [
        settings.SUPABASE_SERVICE_ROLE_KEY,
        settings.SUPABASE_KEY,
        settings.SUPABASE_PUBLISHABLE_KEY,
        settings.SUPABASE_SECRET_KEY,
    ]

    cleaned_candidates = [_clean_env_value(v) for v in jwt_candidates]
    for candidate in cleaned_candidates:
        if candidate and _looks_like_jwt(candidate):
            return candidate

    # If no JWT-style value exists, return first non-empty key for explicit failure.
    for candidate in cleaned_candidates:
        if candidate:
            return candidate

    raise RuntimeError(
        "No Supabase API key configured. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY."
    )

def get_supabase_client() -> Client:
    """Returns a connected Supabase client using the URL and API key from config."""
    url: str = _clean_env_value(settings.SUPABASE_URL)
    if not url:
        raise RuntimeError("SUPABASE_URL is not configured.")

    key: str = _resolve_supabase_key()
    return create_client(url, key)

class _SupabaseProxy:
    """Create a fresh client per top-level call to avoid stale transport state."""

    def __getattr__(self, name: str):
        # unittest.mock and other tooling probe special attrs with hasattr().
        # Avoid creating network clients for those introspection checks.
        if name.startswith('__'):
            raise AttributeError(name)

        try:
            client = get_supabase_client()
            return getattr(client, name)
        except RuntimeError as err:
            # Return a lazy placeholder so patching/mocking can still replace this
            # attribute in tests that intentionally run without Supabase env vars.
            def _missing_supabase_attr(*args, **kwargs):
                raise RuntimeError(str(err))

            return _missing_supabase_attr


supabase = _SupabaseProxy()
