import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np

def plot_cwv_vs_rank(df: pd.DataFrame, metric: str) -> None:
    plt.figure(figsize=(10, 6))
    plt.scatter(df['Rank'], df[metric], alpha=0.5)
    plt.title(f'{metric} vs Rank')
    plt.xlabel('Rank')
    plt.ylabel(metric)
    plt.show()

def plot_cwv_distribution(df: pd.DataFrame, metric: str, bins: int) -> None:
    plt.figure(figsize=(10, 6))
    plt.hist(df[metric], bins=bins, edgecolor='black', alpha=0.7)
    plt.title(f'Distribution of {metric}')
    plt.xlabel(metric)
    plt.ylabel('Frequency')
    plt.show()

def plot_correlation_matrix(df: pd.DataFrame, title: str = 'Correlation Matrix') -> None:
    plt.figure(figsize=(10, 8))
    numeric_df = df.select_dtypes(include=[np.number])
    correlation_matrix = numeric_df.corr()
    sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt=".2f")
    plt.title(title)
    plt.show()
