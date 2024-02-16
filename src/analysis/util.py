import pandas as pd

def threshold_counter(df: pd.DataFrame, column: str, good_threshold: float, needs_improvement_threshold: float) -> tuple:
    numer_of_domains_within_good_threshold = 0
    numer_of_domains_within_needs_improvement_threshold = 0
    numer_of_domains_within_poor_threshold = 0
    for cwv_score in df[column]:
        if cwv_score <= good_threshold:
            numer_of_domains_within_good_threshold += 1
        elif good_threshold < cwv_score <= needs_improvement_threshold:
            numer_of_domains_within_needs_improvement_threshold += 1
        elif cwv_score > needs_improvement_threshold:
            numer_of_domains_within_poor_threshold += 1
    return numer_of_domains_within_good_threshold, numer_of_domains_within_needs_improvement_threshold, numer_of_domains_within_poor_threshold


def reverse_rank(df: pd.DataFrame) -> pd.DataFrame:
    df_reverse = df.copy()
    df_reverse['Rank'] = df_reverse['Rank'].max() - df_reverse['Rank'] + 1

    desired_order = ['Rank', 'LCP', 'FID', 'CLS']
    df_reverse = df_reverse[desired_order]

    for column in ['LCP', 'FID', 'CLS']:
        df_reverse[column] = df_reverse[column].max() - df_reverse[column]
    return df_reverse


def split_dataframe_into_intervals(df: pd.DataFrame, interval_size: int) -> list:
    splitted_df = [df[i:i+interval_size] for i in range(0, len(df), interval_size)]
    return splitted_df


def aggregate_intervals_to_mean(splitted_dataframe: list) -> pd.DataFrame:
    intervals_data = []
    for i, df_i in enumerate(splitted_dataframe):
        interval_mean = df_i[['LCP', 'FID', 'CLS']].mean().to_dict()
        interval_mean['Rank'] = i+1
        intervals_data.append(interval_mean)
    return pd.DataFrame(intervals_data)

def aggregate_intervals_to_median(splitted_dataframe: list) -> pd.DataFrame:
    intervals_data = []
    for i, df_i in enumerate(splitted_dataframe):
        interval_median = df_i[['LCP', 'FID', 'CLS']].median().to_dict()
        interval_median['Rank'] = i+1
        intervals_data.append(interval_median)
    return pd.DataFrame(intervals_data)
