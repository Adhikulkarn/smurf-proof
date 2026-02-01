import math

def min_max_normalize(feature_dict: dict, default=0.0) -> dict:
    """
    Normalizes each feature across all nodes or edges to [0,1]
    and prints any NaN / None values before normalization.
    """

    # -----------------------------
    # 🔍 DEBUG: Detect bad values
    # -----------------------------
    for k, v in feature_dict.items():
        for f, val in v.items():
            if val is None or (isinstance(val, float) and math.isnan(val)):
                print("BAD:", k, f, val)

    keys = list(feature_dict.keys())
    normalized = {k: {} for k in keys}

    # Collect all feature names safely
    feature_names = set()
    for k in keys:
        feature_names.update(feature_dict[k].keys())

    # -----------------------------
    # Min–Max normalization
    # -----------------------------
    for feature in feature_names:
        values = []
        for k in keys:
            v = feature_dict[k].get(feature)
            if v is None:
                continue
            if isinstance(v, float) and math.isnan(v):
                continue
            values.append(v)

        # If feature is completely invalid everywhere
        if not values:
            for k in keys:
                normalized[k][feature] = default
            continue

        min_val = min(values)
        max_val = max(values)

        for k in keys:
            v = feature_dict[k].get(feature, default)
            if v is None or (isinstance(v, float) and math.isnan(v)):
                normalized[k][feature] = default
            elif max_val == min_val:
                normalized[k][feature] = 0.0
            else:
                normalized[k][feature] = (v - min_val) / (max_val - min_val)

    return normalized
