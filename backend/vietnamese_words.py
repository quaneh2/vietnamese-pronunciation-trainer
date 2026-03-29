"""Vietnamese word dictionary for pronunciation and vocabulary practice.

Words are loaded from data/words.json. Each entry contains:
  - word:        the Vietnamese word
  - translation: English meaning(s)
  - word_type:   grammatical category (noun, verb, adjective, etc.)
  - examples:    list of {vietnamese, english} example sentences
"""

import json
import os

_DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'words.json')


def _load_words():
    with open(_DATA_PATH, encoding='utf-8') as f:
        return json.load(f)['words']


VIETNAMESE_WORDS = _load_words()


def get_all_words():
    """Return all words from the dictionary."""
    return VIETNAMESE_WORDS


def get_word_by_index(index):
    """Return a specific word by index, or None if out of range."""
    if 0 <= index < len(VIETNAMESE_WORDS):
        return VIETNAMESE_WORDS[index]
    return None
