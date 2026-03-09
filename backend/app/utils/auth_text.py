"""
auth_text.py
Text normalization and matching utilities for product authentication.
Handles OCR noise: spacing splits, punctuation noise, missing letters.
"""
import re


def normalize_text(text: str) -> str:
    """
    Normalizes OCR output:
    - Converts to uppercase
    - Strips punctuation noise (quotes, tildes, pipes, slashes, etc.)
      while preserving letters, digits, spaces, and hyphens.
      e.g. 'FOR"' -> 'FOR',  '~1SOML' -> '1SOML'
    - Collapses multiple spaces
    - Strips leading/trailing whitespace
    """
    if not text:
        return ""
    text = str(text).upper()
    # Remove characters that are not letters, digits, spaces, or hyphens
    text = re.sub(r"[^A-Z0-9 \-]", " ", text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def compact_text(text: str) -> str:
    """
    Removes ALL whitespace and non-alphanumeric characters.
    Useful for matching when OCR splits words (e.g. 'S P A' -> 'SPA').
    """
    if not text:
        return ""
    return re.sub(r'[^A-Z0-9]', '', str(text).upper())


def extract_word_tokens(text: str) -> set:
    """
    Extracts alphanumeric word tokens from text as a set.
    Useful for simple keyword intersection checks.
    """
    if not text:
        return set()
    return set(re.findall(r'[A-Z0-9]+', str(text).upper()))
