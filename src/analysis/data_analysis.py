import pandas as pd
import statsmodels.api as sm

import util as util
import data_visualization as vis

def perform_descriptive_analysis(df: pd.DataFrame) -> pd.DataFrame:
    print("------------------Threshold Counts------------------")
    cwv_metrics = [
        {"name": "LCP", "good_threshold": 2500, "needs_improvement_threshold": 4000},
        {"name": "FID", "good_threshold": 100, "needs_improvement_threshold": 300},
        {"name": "CLS", "good_threshold": 0.1, "needs_improvement_threshold": 0.25}
    ]

    for metric in cwv_metrics:
        threshold_count = util.threshold_counter(
            df,
            metric["name"],
            metric["good_threshold"],
            metric["needs_improvement_threshold"]
        )

        print(f"Numbers of domains within good threshold for {metric['name']}: {threshold_count[0]}")
        print(f"Numbers of domains within needs improvement threshold for {metric['name']}: {threshold_count[1]}")
        print(f"Numbers of domains within poor threshold for {metric['name']}: {threshold_count[2]}\n")

    print("------------------Descriptive Statistics------------------")
    print(df.describe())


def perform_correlation_analyis_spearman(df: pd.DataFrame) -> pd.DataFrame:
    print("------------------Spearman's Correlation Analysis------------------")
    df_reversed = util.reverse_rank(df)
    corr_matrix = df_reversed.corr(method='spearman')
    print(corr_matrix)
    #vis.plot_correlation_matrix(corr_matrix)


def perform_multiple_regresion_analysis(df: pd.DataFrame) -> None:
    print("------------------Multiple Regression Analysis------------------")
    df_standardized = df.copy()
    df_without_nan = df_standardized.dropna()
    X = df_without_nan[['LCP', 'FID', 'CLS']]
    Y = df_without_nan['Rank']
    X = sm.add_constant(X)
    model = sm.OLS(Y, X).fit()
    print(model.summary())


def perform_cross_interval_analysis(df: pd.DataFrame, interval_size: int) -> None:
    df_splitted = util.split_dataframe_into_intervals(df, interval_size)

    # Printing the first 5 and last 5 intervals
    for i, df in enumerate(df_splitted):
        if i < 5 or i >= (len(df_splitted) - 5):
            print(f'Interval {i+1}:')
            print(perform_descriptive_analysis(df))
            print()

    df_aggregated_intervals = util.aggregate_intervals_to_mean(df_splitted)
    perform_correlation_analyis_spearman(df_aggregated_intervals)

    perform_multiple_regresion_analysis(df_aggregated_intervals)


def perform_intra_interval_analysis(df: pd.DataFrame, interval_size: int) -> None:
    splitted_df = util.split_dataframe_into_intervals(df, interval_size)
    for i, df_i in enumerate(splitted_df):
        print(f'Interval {i+1}:')
        perform_descriptive_analysis(df_i)

        perform_correlation_analyis_spearman(df_i)

        perform_multiple_regresion_analysis(df_i)

