import data_processing as dp

VITALS_REPORT_CSV_FILE_PATH = './data/CoreWebVitalsReport.csv';

def main() -> None:
    df = dp.load_data(VITALS_REPORT_CSV_FILE_PATH)
    df = dp.clean_data(df)

    print(df)

if __name__ == "__main__":
    main()
