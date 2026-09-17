import logging
import sys
from datetime import datetime, timezone

from app.core.config import settings

# ANSI color codes
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"

# Foreground colors
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
CYAN = "\033[36m"
WHITE = "\033[37m"

LEVEL_STYLES = {
    "DEBUG": f"{DIM}{WHITE}[DEBUG]{RESET}",
    "INFO": f"{BOLD}{GREEN}[INFO ]{RESET}",
    "WARNING": f"{BOLD}{YELLOW}[WARN ]{RESET}",
    "ERROR": f"{BOLD}{RED}[ERROR]{RESET}",
    "CRITICAL": f"{BOLD}{RED}\033[41m[CRIT ]{RESET}",
}

FLAG_STYLES = {
    "HTTP_IN": f"{BOLD}{CYAN}📥 [REQ IN ]{RESET}",
    "HTTP_OUT": f"{BOLD}{GREEN}📤 [RESP OUT]{RESET}",
    "AGENT_IN": f"{BOLD}{MAGENTA}🤖 [AGENT IN]{RESET}",
    "AGENT_OUT": f"{BOLD}{BLUE}💬 [AGENT OUT]{RESET}",
    "PIPELINE": f"{BOLD}{YELLOW}⚙️  [PIPELINE ]{RESET}",
}


class CleanColoredFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3]
        level_badge = LEVEL_STYLES.get(record.levelname, f"[{record.levelname}]")
        logger_name = f"{DIM}{record.name:<16}{RESET}"
        msg = record.getMessage()

        # Format custom pipeline tags if present in message
        for tag, badge in FLAG_STYLES.items():
            if f"[{tag}]" in msg:
                msg = msg.replace(f"[{tag}]", badge)

        line = f"{DIM}{now_str}{RESET} | {level_badge} | {logger_name} | {msg}"
        if record.exc_info and record.exc_info[1]:
            line += f"\n{RED}{self.formatException(record.exc_info)}{RESET}"
        return line


def setup_logging() -> None:
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(CleanColoredFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers.clear()
    root_logger.addHandler(handler)

    # Suppress verbose third-party/engine logs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
