import pandas as pd

import data_preprocessing as dp
import data_analysis as da

CRUX_VITALS_REPORT_CSV_FILE_PATH = './data/final/CoreWebVitalsReportCrUX.csv'
CRAWLER_VITALS_REPORT_CSV_FILE_PATH = './data/final/CoreWebVitalsReportLighthouse.csv'

def analyze_data(data_csv_file_path: str) -> None:
    print("Starting Analysis...")
    df = pd.read_csv(data_csv_file_path, on_bad_lines='error')

    # Explanatory Data Analysis (EDA)
    #da.eda(df)

    # Data Preprocessing
    df = dp.preprocess_data(df)
    df_outliers_removed = dp.remove_outliers(df.copy())

    #da.eda(df_outliers_removed)

    # Descriptive Statistics
    #da.perform_descriptive_analysis(df)

    # Spearman's Correlation
    da.perform_correlation_analyis_spearman(df)
    da.perform_correlation_analyis_spearman(df_outliers_removed)

    # Multiple Regression Analysis
    #da.perform_multiple_regresion_analysis(df)
    #da.perform_multiple_regresion_analysis(df_outliers_removed)

    # Interval Analysis
    #da.perform_cross_interval_analysis(df, 100)
    #da.perform_cross_interval_analysis(df, 1000)
    #da.perform_cross_interval_analysis(df, 10000)

    da.perform_intra_interval_analysis(df, 100)
    da.perform_intra_interval_analysis(df, 1000)
    da.perform_intra_interval_analysis(df, 10000)

    print("Analysis Completed.")

def main() -> None:
    analyze_data(CRUX_VITALS_REPORT_CSV_FILE_PATH)
    #analyze_data(CRAWLER_VITALS_REPORT_CSV_FILE_PATH)

if __name__ == "__main__":
    main()
