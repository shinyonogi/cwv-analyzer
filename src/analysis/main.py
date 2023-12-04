import data_processing as dp
import data_analysis as da
import data_visualization as vis

VITALS_REPORT_CSV_FILE_PATH = './data/CoreWebVitalsReport.csv';

def main() -> None:
    df = dp.load_data(VITALS_REPORT_CSV_FILE_PATH)
    df = dp.clean_data(df)

    """
    descriptive_stats = da.compute_descriptive_statistics(df)
    print("Descriptive Stats: \n", descriptive_stats)

    ranking_correlation = da.analyze_ranking_correlation(df)
    print("Ranking Correlation:\n", ranking_correlation)
    """

    for metric in ['LCP', 'FID', 'CLS']:
        vis.plot_cwv_vs_rank(df, metric)

    for metric in ['LCP', 'FID', 'CLS']:
        vis.plot_cwv_distribution(df, metric, bins=50)

    vis.plot_correlation_matrix(df)

if __name__ == "__main__":
    main()
