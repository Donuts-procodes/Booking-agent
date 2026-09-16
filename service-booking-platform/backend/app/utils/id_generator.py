import random
import string
import time


# Generates a collision-resistant short booking ID like #BK7042 combining milliseconds sequence with random digits
def generate_booking_id(prefix: str = "BK") -> str:
    """Generates a collision-resistant short booking ID like #BK7042.

    Uses timestamp-based sequence combined with random suffix to minimize
    collision probability without requiring a database sequence.
    """
    timestamp_part = int(time.time() * 1000) % 10000
    random_suffix = "".join(random.choices(string.digits, k=2))
    return f"#{prefix}{timestamp_part}{random_suffix}"
