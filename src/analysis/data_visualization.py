import matplotlib.pyplot as plt
import scipy.stats as stats
import seaborn as sns
import pandas as pd
import numpy as np

plt.rcParams.update({'font.size': 18})

def plot_histogram(df: pd.DataFrame, column: str, bins: int) -> None:
    plt.figure(figsize=(10, 6))
    plt.hist(df[column], bins=bins, edgecolor='black', alpha=0.7)
    #plt.title(f'Distribution of {column}')
    plt.xlabel(column)
    plt.ylabel('Frequency')
    plt.show()

def plot_boxplot(df: pd.DataFrame, column: str) -> None:
    plt.figure(figsize=(10, 6))
    sns.boxplot(x=df[column])
    #plt.title(f'Boxplot of {column}')
    plt.xlabel(column)
    plt.show()

def plot_qqplot(df: pd.DataFrame, column: str) -> None:
    plt.figure(figsize=(10, 6))
    stats.probplot(df[column], dist='norm', plot=plt)
    plt.title(f'QQPlot of {column}')
    plt.xlabel('Theoretical Quantiles')
    plt.ylabel('Ordered Values')
    plt.show()

def plot_correlation_matrix(corr_matrix: pd.DataFrame) -> None:
    plt.figure(figsize=(10, 8))
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    sns.heatmap(corr_matrix, mask=mask, annot=True, fmt='.2f', cmap='coolwarm', square=True,
                annot_kws={'size': 18},
                cbar_kws={"shrink": 0.8, "aspect": 10},
                vmax=1
                )
    plt.show()
