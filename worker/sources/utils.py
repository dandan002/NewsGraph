from bs4 import BeautifulSoup


def extract_text(html: str, max_chars: int = 6000) -> str:
    """Strip HTML and return readable text, capped at max_chars."""
    soup = BeautifulSoup(html, "html.parser")
    # Remove non-content elements
    for tag in soup(["script", "style", "nav", "header", "footer", "noscript", "meta", "link"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    return text[:max_chars]
