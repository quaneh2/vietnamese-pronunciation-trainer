"""Vietnamese word dictionary for pronunciation practice.

Contains 2-3 character Vietnamese words with English translations.
"""

VIETNAMESE_WORDS = [
    # 2-letter words
    {"word": "ba", "translation": "three / father"},
    {"word": "bà", "translation": "grandmother"},
    {"word": "bị", "translation": "to suffer / passive marker"},
    {"word": "bò", "translation": "cow"},
    {"word": "bờ", "translation": "shore / edge"},
    {"word": "cá", "translation": "fish"},
    {"word": "cò", "translation": "heron"},
    {"word": "có", "translation": "to have / yes"},
    {"word": "cô", "translation": "aunt / miss"},
    {"word": "da", "translation": "skin"},
    {"word": "dê", "translation": "goat"},
    {"word": "đá", "translation": "stone / ice"},
    {"word": "đi", "translation": "to go"},
    {"word": "đó", "translation": "that"},
    {"word": "ếch", "translation": "frog"},
    {"word": "gà", "translation": "chicken"},
    {"word": "gấu", "translation": "bear"},
    {"word": "hà", "translation": "river"},
    {"word": "hó", "translation": "to shout"},
    {"word": "kê", "translation": "to prop up"},
    {"word": "kỳ", "translation": "strange / term"},
    {"word": "lá", "translation": "leaf"},
    {"word": "lò", "translation": "oven / stove"},
    {"word": "lý", "translation": "reason"},
    {"word": "má", "translation": "mother / cheek"},
    {"word": "mà", "translation": "but / that"},
    {"word": "mẹ", "translation": "mother"},
    {"word": "mù", "translation": "blind"},
    {"word": "na", "translation": "custard apple"},
    {"word": "nó", "translation": "he / she / it"},
    {"word": "ô", "translation": "square / umbrella"},
    {"word": "ơi", "translation": "hey / oh"},
    {"word": "rể", "translation": "son-in-law"},
    {"word": "rồi", "translation": "already / then"},
    {"word": "sao", "translation": "star / why"},
    {"word": "tai", "translation": "ear"},
    {"word": "tay", "translation": "hand / arm"},
    {"word": "thì", "translation": "then / so"},
    {"word": "tôi", "translation": "I / me"},
    {"word": "tô", "translation": "bowl"},
    {"word": "tủ", "translation": "cabinet"},
    {"word": "và", "translation": "and"},
    {"word": "vì", "translation": "because"},
    {"word": "voi", "translation": "elephant"},
    {"word": "vở", "translation": "notebook"},
    {"word": "xem", "translation": "to watch / see"},
    {"word": "xin", "translation": "please / to ask"},
    {"word": "xuê", "translation": "slanted"},

    # 3-letter words
    {"word": "ăn", "translation": "to eat"},
    {"word": "bạn", "translation": "friend"},
    {"word": "bảo", "translation": "to tell / to say"},
    {"word": "bây", "translation": "now / this"},
    {"word": "béo", "translation": "fat"},
    {"word": "biết", "translation": "to know"},
    {"word": "bớt", "translation": "to reduce"},
    {"word": "buồn", "translation": "sad"},
    {"word": "cao", "translation": "tall / high"},
    {"word": "chó", "translation": "dog"},
    {"word": "chị", "translation": "older sister"},
    {"word": "đau", "translation": "pain / to hurt"},
    {"word": "đây", "translation": "here"},
    {"word": "đêm", "translation": "night"},
    {"word": "đến", "translation": "to arrive / to come"},
    {"word": "đói", "translation": "hungry"},
    {"word": "gần", "translation": "near"},
    {"word": "giá", "translation": "price"},
    {"word": "hay", "translation": "good / or"},
    {"word": "học", "translation": "to study / to learn"},
    {"word": "hỏi", "translation": "to ask"},
    {"word": "khó", "translation": "difficult"},
    {"word": "làm", "translation": "to do / to make"},
    {"word": "lớn", "translation": "big / large"},
    {"word": "mới", "translation": "new"},
    {"word": "một", "translation": "one"},
    {"word": "nào", "translation": "which / any"},
    {"word": "này", "translation": "this"},
    {"word": "nhà", "translation": "house / home"},
    {"word": "nhỏ", "translation": "small"},
    {"word": "như", "translation": "like / as"},
    {"word": "nói", "translation": "to speak / to say"},
    {"word": "phải", "translation": "must / right"},
    {"word": "sớm", "translation": "early"},
    {"word": "tên", "translation": "name"},
    {"word": "tốt", "translation": "good"},
    {"word": "trà", "translation": "tea"},
    {"word": "trái", "translation": "fruit / left"},
    {"word": "trẻ", "translation": "young"},
    {"word": "văn", "translation": "literature"},
    {"word": "vui", "translation": "happy / fun"},
    {"word": "xanh", "translation": "green / blue"},
    {"word": "xấu", "translation": "ugly / bad"},
]


def get_all_words():
    """Get all words from the dictionary.

    Returns:
        list: List of word dictionaries
    """
    return VIETNAMESE_WORDS


def get_word_by_index(index):
    """Get a specific word by index.

    Args:
        index (int): Index of the word

    Returns:
        dict: Word dictionary or None if index out of range
    """
    if 0 <= index < len(VIETNAMESE_WORDS):
        return VIETNAMESE_WORDS[index]
    return None
