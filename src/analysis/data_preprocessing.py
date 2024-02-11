import pandas as pd
from sklearn.preprocessing import StandardScaler

def delete_domain_column(df: pd.DataFrame) -> pd.DataFrame:
    df.drop(columns=['Domain'], inplace=True)
    return df

def delete_rank_column(df: pd.DataFrame) -> pd.DataFrame:
    df.drop(columns=['Rank'], inplace=True)
    return df

def replace_undefined_cwv_with_nan(df: pd.DataFrame) -> pd.DataFrame:
    columns_to_process = ['LCP', 'FID', 'CLS']
    for column in columns_to_process:
        df[column] = pd.to_numeric(df[column].replace('null', pd.NA), errors='coerce')
    return df

def convert_dtypes(df: pd.DataFrame) -> pd.DataFrame:
    dtype_mappings = {'Rank': 'int32', 'LCP': 'float32', 'FID': 'float32', 'CLS': 'float32'}
    return df.astype(dtype_mappings)

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    df = delete_domain_column(df)
    df = replace_undefined_cwv_with_nan(df)
    df = convert_dtypes(df)
    return df

def remove_outliers(df: pd.DataFrame) -> pd.DataFrame:
    for col in ['LCP', 'FID', 'CLS']:
        bounds = df[col].quantile([0.25, 0.75])
        IQR = bounds[0.75] - bounds[0.25]
        df = df[df[col].between(bounds[0.25] - 1.5 * IQR, bounds[0.75] + 1.5 * IQR)]
    return df

def standardize(df: pd.DataFrame) -> pd.DataFrame:
    scaler = StandardScaler()
    df[['Rank', 'LCP', 'FID', 'CLS']] = scaler.fit_transform(df[['Rank', 'LCP', 'FID', 'CLS']])
    return df
