import pandas as pd
import numpy as np

def compute_descriptive_statistics(df: pd.DataFrame) -> pd.DataFrame:
    cwv_metrics_columns = df.columns.drop('Rank')
    return df[cwv_metrics_columns].describe()

def analyze_ranking_correlation(df: pd.DataFrame) -> pd.DataFrame:
    cwv_metrics_columns = df.columns.drop('Domain')
    return df[cwv_metrics_columns].corrwith(df['Rank'])
