#!/usr/bin/env python3
"""
AUREA PDF Extraction Test Results Visualization
================================================
Auto-generated visualization script for test results analysis.

Usage:
    python visualize_results.py [--csv CSV_FILE]
    
Requirements:
    pip install pandas matplotlib seaborn
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import json
import sys
import os
from pathlib import Path

# Set style
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

def find_latest_csv():
    """Find the most recent CSV file in the directory."""
    script_dir = Path(__file__).parent
    csv_files = list(script_dir.glob("test_data_*.csv"))
    if not csv_files:
        print("Error: No CSV files found in", script_dir)
        sys.exit(1)
    return max(csv_files, key=lambda x: x.stat().st_mtime)

def load_data(csv_path=None):
    """Load test data from CSV."""
    if csv_path is None:
        csv_path = find_latest_csv()
    print(f"📊 Loading data from: {csv_path}")
    return pd.read_csv(csv_path)

def create_dashboard(df, output_dir=None):
    """Create comprehensive visualization dashboard."""
    if output_dir is None:
        output_dir = Path(__file__).parent
    
    # Create figure with subplots
    fig = plt.figure(figsize=(20, 16))
    fig.suptitle('AUREA PDF Extraction - Model Evaluation Dashboard', fontsize=16, fontweight='bold', y=0.98)
    
    # 1. Overall Pass/Fail Rate (Pie Chart)
    ax1 = fig.add_subplot(3, 3, 1)
    status_counts = df['status'].value_counts()
    colors = ['#2ecc71' if s == 'PASSED' else '#e74c3c' for s in status_counts.index]
    ax1.pie(status_counts, labels=status_counts.index, autopct='%1.1f%%', colors=colors, startangle=90)
    ax1.set_title('Overall Pass Rate', fontweight='bold')
    
    # 2. Pass Rate by Category (Bar Chart)
    ax2 = fig.add_subplot(3, 3, 2)
    category_stats = df.groupby('category').agg({
        'status': lambda x: (x == 'PASSED').sum() / len(x) * 100
    }).reset_index()
    category_stats.columns = ['category', 'pass_rate']
    bars = ax2.bar(category_stats['category'], category_stats['pass_rate'], color=sns.color_palette("viridis", len(category_stats)))
    ax2.set_ylabel('Pass Rate (%)')
    ax2.set_title('Pass Rate by Category', fontweight='bold')
    ax2.set_ylim(0, 100)
    ax2.tick_params(axis='x', rotation=45)
    for bar, rate in zip(bars, category_stats['pass_rate']):
        ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, f'{rate:.1f}%', ha='center', va='bottom', fontsize=8)
    
    # 3. Category Accuracy Distribution (Histogram)
    ax3 = fig.add_subplot(3, 3, 3)
    passed_df = df[df['status'] == 'PASSED']
    if not passed_df.empty:
        ax3.hist(passed_df['category_accuracy'], bins=10, color='#3498db', edgecolor='black', alpha=0.7)
        ax3.axvline(passed_df['category_accuracy'].mean(), color='red', linestyle='--', label=f'Mean: {passed_df["category_accuracy"].mean():.1f}%')
        ax3.legend()
    ax3.set_xlabel('Category Accuracy (%)')
    ax3.set_ylabel('Frequency')
    ax3.set_title('Category Accuracy Distribution', fontweight='bold')
    
    # 4. Extraction Time by Model (Box Plot)
    ax4 = fig.add_subplot(3, 3, 4)
    model_data = df[df['model_used'] != 'unknown']
    if not model_data.empty:
        model_data['extraction_time_s'] = model_data['extraction_time_ms'] / 1000
        sns.boxplot(data=model_data, x='model_used', y='extraction_time_s', ax=ax4, palette="Set2")
        ax4.set_ylabel('Extraction Time (seconds)')
        ax4.set_xlabel('Model')
    ax4.set_title('Extraction Time by Model', fontweight='bold')
    ax4.tick_params(axis='x', rotation=15)
    
    # 5. Field Completeness by Category (Heatmap-style)
    ax5 = fig.add_subplot(3, 3, 5)
    if 'field_completeness' in df.columns:
        category_field = df.groupby('category')['field_completeness'].mean().sort_values(ascending=False)
        bars = ax5.barh(category_field.index, category_field.values, color=plt.cm.RdYlGn(category_field.values / 100))
        ax5.set_xlabel('Field Completeness (%)')
        ax5.set_title('Avg Field Completeness by Category', fontweight='bold')
        ax5.set_xlim(0, 100)
        for bar, val in zip(bars, category_field.values):
            ax5.text(val + 1, bar.get_y() + bar.get_height()/2, f'{val:.0f}%', va='center', fontsize=8)
    
    # 6. Model Usage Distribution
    ax6 = fig.add_subplot(3, 3, 6)
    model_counts = df['model_used'].value_counts()
    ax6.pie(model_counts, labels=model_counts.index, autopct='%1.1f%%', colors=sns.color_palette("pastel"), startangle=90)
    ax6.set_title('Model Usage Distribution', fontweight='bold')
    
    # 7. Extraction Time Trend
    ax7 = fig.add_subplot(3, 3, 7)
    df['test_order'] = range(len(df))
    ax7.scatter(df['test_order'], df['extraction_time_ms']/1000, c=df['status'].map({'PASSED': '#2ecc71', 'FAILED': '#e74c3c'}), alpha=0.6, s=50)
    ax7.set_xlabel('Test Order')
    ax7.set_ylabel('Extraction Time (s)')
    ax7.set_title('Extraction Time Over Test Sequence', fontweight='bold')
    
    # 8. Expected vs Found Categories
    ax8 = fig.add_subplot(3, 3, 8)
    passed_with_categories = passed_df[passed_df['expected_categories'] > 0]
    if not passed_with_categories.empty:
        ax8.scatter(passed_with_categories['expected_categories'], 
                   passed_with_categories['found_categories'], 
                   alpha=0.6, s=60, c='#3498db')
        max_val = max(passed_with_categories['expected_categories'].max(), 
                     passed_with_categories['found_categories'].max())
        ax8.plot([0, max_val], [0, max_val], 'r--', alpha=0.5, label='Perfect Match')
        ax8.legend()
    ax8.set_xlabel('Expected Categories')
    ax8.set_ylabel('Found Categories')
    ax8.set_title('Expected vs Found Categories', fontweight='bold')
    
    # 9. Summary Statistics Table
    ax9 = fig.add_subplot(3, 3, 9)
    ax9.axis('off')
    
    # Calculate summary stats
    total_tests = len(df)
    passed_tests = (df['status'] == 'PASSED').sum()
    pass_rate = passed_tests / total_tests * 100
    avg_time = df['extraction_time_ms'].mean() / 1000
    avg_accuracy = passed_df['category_accuracy'].mean() if not passed_df.empty else 0
    avg_items = passed_df['found_items'].mean() if not passed_df.empty else 0
    
    summary_text = f"""
    ╔════════════════════════════════════════╗
    ║         SUMMARY STATISTICS             ║
    ╠════════════════════════════════════════╣
    ║  Total Tests:        {total_tests:>6}            ║
    ║  Passed:             {passed_tests:>6} ({pass_rate:.1f}%)     ║
    ║  Failed:             {total_tests - passed_tests:>6}            ║
    ║                                        ║
    ║  Avg Extraction:     {avg_time:>6.1f}s           ║
    ║  Category Accuracy:  {avg_accuracy:>6.1f}%          ║
    ║  Avg Items Found:    {avg_items:>6.1f}           ║
    ╚════════════════════════════════════════╝
    """
    ax9.text(0.5, 0.5, summary_text, transform=ax9.transAxes, fontsize=10, 
             verticalalignment='center', horizontalalignment='center',
             fontfamily='monospace', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    
    # Save figure
    output_path = output_dir / 'test_results_dashboard.png'
    plt.savefig(output_path, dpi=150, bbox_inches='tight', facecolor='white')
    print(f"📈 Dashboard saved to: {output_path}")
    
    return fig

def create_model_comparison(df, output_dir=None):
    """Create model comparison visualization."""
    if output_dir is None:
        output_dir = Path(__file__).parent
    
    model_data = df[df['model_used'] != 'unknown']
    if model_data.empty:
        print("⚠️  No model data available for comparison")
        return None
    
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('AI Model Comparison', fontsize=14, fontweight='bold')
    
    # 1. Success Rate by Model
    ax1 = axes[0, 0]
    model_success = model_data.groupby('model_used').agg({
        'status': lambda x: (x == 'PASSED').sum() / len(x) * 100
    }).reset_index()
    model_success.columns = ['model', 'success_rate']
    bars = ax1.bar(model_success['model'], model_success['success_rate'], color=['#3498db', '#e74c3c'])
    ax1.set_ylabel('Success Rate (%)')
    ax1.set_title('Success Rate by Model')
    ax1.set_ylim(0, 100)
    for bar, rate in zip(bars, model_success['success_rate']):
        ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, f'{rate:.1f}%', ha='center')
    
    # 2. Average Extraction Time
    ax2 = axes[0, 1]
    model_time = model_data.groupby('model_used')['extraction_time_ms'].mean() / 1000
    bars = ax2.bar(model_time.index, model_time.values, color=['#2ecc71', '#f39c12'])
    ax2.set_ylabel('Avg Extraction Time (s)')
    ax2.set_title('Average Extraction Time by Model')
    for bar, time in zip(bars, model_time.values):
        ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5, f'{time:.1f}s', ha='center')
    
    # 3. Category Accuracy by Model
    ax3 = axes[1, 0]
    passed_model = model_data[model_data['status'] == 'PASSED']
    if not passed_model.empty:
        model_accuracy = passed_model.groupby('model_used')['category_accuracy'].mean()
        bars = ax3.bar(model_accuracy.index, model_accuracy.values, color=['#9b59b6', '#1abc9c'])
        ax3.set_ylabel('Avg Category Accuracy (%)')
        ax3.set_title('Category Accuracy by Model')
        ax3.set_ylim(0, 100)
        for bar, acc in zip(bars, model_accuracy.values):
            ax3.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, f'{acc:.1f}%', ha='center')
    
    # 4. Usage Count
    ax4 = axes[1, 1]
    model_counts = model_data['model_used'].value_counts()
    ax4.pie(model_counts, labels=[f'{m}\n({c} tests)' for m, c in model_counts.items()], 
            autopct='%1.1f%%', colors=['#3498db', '#e74c3c'], startangle=90)
    ax4.set_title('Model Usage Distribution')
    
    plt.tight_layout()
    
    output_path = output_dir / 'model_comparison.png'
    plt.savefig(output_path, dpi=150, bbox_inches='tight', facecolor='white')
    print(f"📊 Model comparison saved to: {output_path}")
    
    return fig

def main():
    """Main visualization function."""
    import argparse
    parser = argparse.ArgumentParser(description='Visualize AUREA PDF extraction test results')
    parser.add_argument('--csv', type=str, help='Path to CSV file (default: latest in directory)')
    parser.add_argument('--show', action='store_true', help='Show plots interactively')
    args = parser.parse_args()
    
    print("=" * 60)
    print("  AUREA PDF Extraction - Test Results Visualization")
    print("=" * 60)
    print()
    
    # Load data
    csv_path = Path(args.csv) if args.csv else None
    df = load_data(csv_path)
    
    print(f"📋 Loaded {len(df)} test results")
    print(f"   - Passed: {(df['status'] == 'PASSED').sum()}")
    print(f"   - Failed: {(df['status'] == 'FAILED').sum()}")
    print()
    
    # Create visualizations
    output_dir = Path(__file__).parent
    
    print("🎨 Generating visualizations...")
    create_dashboard(df, output_dir)
    create_model_comparison(df, output_dir)
    
    print()
    print("✅ Visualization complete!")
    print()
    print("Generated files:")
    print(f"   📈 {output_dir / 'test_results_dashboard.png'}")
    print(f"   📊 {output_dir / 'model_comparison.png'}")
    
    if args.show:
        plt.show()

if __name__ == '__main__':
    main()
