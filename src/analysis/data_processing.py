import pandas as pd
from typing import Dict

def load_data(path_to_csv_file: str) -> pd.DataFrame:
    return pd.read_csv(path_to_csv_file)

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    df = replace_undefined_cwv_with_nan(df)
    df = convert_dtypes(df)
    return df

def replace_undefined_cwv_with_nan(df: pd.DataFrame) -> pd.DataFrame:
    columns_to_process = ['LCP', 'FID', 'CLS']
    for column in columns_to_process:
        df[column] = pd.to_numeric(df[column].replace('undefined', pd.NA), errors='coerce')
    return df

def convert_dtypes(df: pd.DataFrame) -> pd.DataFrame:
    dtype_mappings = {'Rank': 'int32', 'LCP': 'float', 'FID': 'float', 'CLS': 'float'}
    return df.astype(dtype_mappings)
