import re


def clean_text(text: str) -> str:
    # Remove null characters
    text = text.replace("\x00", "")

    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Remove extra spaces and tabs
    text = re.sub(r"[ \t]+", " ", text)

    # Remove excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Remove spaces at line beginnings and endings
    lines = [line.strip() for line in text.split("\n")]

    text = "\n".join(lines)

    return text.strip()