#!/usr/bin/env python3
"""
Quick Estimate Comparison Tool with Visualizations

Compares results from quick estimate API tests:
- With Google Search Grounding (real-time web data)
- Without Grounding (AI knowledge base only)

Usage:
    python3 compare_results.py <with_grounding.json> <without_grounding.json>
    python3 compare_results.py  # Uses latest results
    python3 compare_results.py --graphs-only  # Only generate graphs
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
import numpy as np

# ANSI colors
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'


@dataclass
class ComparisonResult:
    """Holds comparison data for a single scenario"""
    experience_level: str
    skills: str
    
    # With grounding
    with_rate: Optional[float]
    with_sources_count: int
    with_has_urls: bool
    with_software_cost: Optional[float]
    with_workspace_cost: Optional[float]
    with_income: Optional[float]
    
    # Without grounding
    without_rate: Optional[float]
    without_sources_count: int
    without_has_urls: bool
    without_software_cost: Optional[float]
    without_workspace_cost: Optional[float]
    without_income: Optional[float]
    
    @property
    def rate_difference(self) -> Optional[float]:
        if self.with_rate and self.without_rate:
            return self.with_rate - self.without_rate
        return None
    
    @property
    def rate_diff_percent(self) -> Optional[float]:
        if self.with_rate and self.without_rate and self.without_rate > 0:
            return ((self.with_rate - self.without_rate) / self.without_rate) * 100
        return None


def load_json_file(filepath: str) -> Dict[str, Any]:
    """Load and parse a JSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)


def extract_result_data(result: Dict[str, Any]) -> Dict[str, Any]:
    """Extract relevant data from a single result"""
    if not result.get('success', False):
        return {
            'success': False,
            'rate': None,
            'software_cost': None,
            'workspace_cost': None,
            'income': None,
            'sources_count': 0,
            'has_urls': False,
            'sources': []
        }
    
    estimate = result.get('estimate', {})
    costs = result.get('ai_researched_costs', {})
    income_data = result.get('ai_researched_income', {})
    
    return {
        'success': True,
        'rate': estimate.get('recommended_rate'),
        'software_cost': costs.get('monthly_software_cost'),
        'workspace_cost': costs.get('monthly_workspace_cost'),
        'equipment_cost': costs.get('monthly_equipment_cost'),
        'total_expenses': costs.get('total_monthly_expenses'),
        'income': income_data.get('suggested_monthly_income'),
        'sources_count': result.get('sources_count', 0),
        'has_urls': result.get('has_web_urls', False),
        'sources': result.get('sources', []),
        'market_median': result.get('market_research', {}).get('median_rate'),
        'market_position': result.get('market_research', {}).get('position')
    }


def compare_results(with_grounding: Dict, without_grounding: Dict) -> List[ComparisonResult]:
    """Compare results from both test runs"""
    comparisons = []
    
    with_results = {r['experience_level']: r for r in with_grounding.get('results', [])}
    without_results = {r['experience_level']: r for r in without_grounding.get('results', [])}
    
    all_levels = set(with_results.keys()) | set(without_results.keys())
    
    for level in sorted(all_levels):
        with_data = extract_result_data(with_results.get(level, {}))
        without_data = extract_result_data(without_results.get(level, {}))
        
        comparison = ComparisonResult(
            experience_level=level,
            skills=with_results.get(level, {}).get('skills', 'N/A'),
            with_rate=with_data['rate'],
            with_sources_count=with_data['sources_count'],
            with_has_urls=with_data['has_urls'],
            with_software_cost=with_data.get('software_cost'),
            with_workspace_cost=with_data.get('workspace_cost'),
            with_income=with_data.get('income'),
            without_rate=without_data['rate'],
            without_sources_count=without_data['sources_count'],
            without_has_urls=without_data['has_urls'],
            without_software_cost=without_data.get('software_cost'),
            without_workspace_cost=without_data.get('workspace_cost'),
            without_income=without_data.get('income')
        )
        comparisons.append(comparison)
    
    return comparisons


def create_visualizations(comparisons: List[ComparisonResult], output_dir: Path):
    """Create all visualization graphs as individual files and combined PDF"""
    # Set style
    plt.style.use('seaborn-v0_8-darkgrid')
    colors = {
        'with': '#2E86AB',      # Blue
        'without': '#A23B72',   # Purple
        'positive': '#06A77D',  # Green
        'negative': '#D84654',  # Red
        'neutral': '#F18F01'    # Orange
    }
    
    # Create comparison_visual subdirectory
    visual_dir = output_dir / 'comparison_visual'
    visual_dir.mkdir(exist_ok=True, parents=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    print(f"\n  {Colors.CYAN}Generating individual chart images...{Colors.END}\n")
    
    # Store paths for PDF compilation
    image_paths = []
    
    # 1. Hourly Rate Comparison (Main chart)
    fig, ax = plt.subplots(figsize=(14, 8))
    create_rate_comparison_chart(ax, comparisons, colors)
    fig.suptitle('Hourly Rate Comparison', fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'01_rate_comparison_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    # 2. Rate Difference Chart
    fig, ax = plt.subplots(figsize=(12, 8))
    create_rate_difference_chart(ax, comparisons, colors)
    fig.suptitle('Rate Difference Analysis', fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'02_rate_difference_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    # 3. Cost Comparison
    fig, ax = plt.subplots(figsize=(12, 8))
    create_cost_comparison_chart(ax, comparisons, colors)
    fig.suptitle('Monthly Cost Estimates', fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'03_cost_comparison_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    # 4. Source Count Comparison
    fig, ax = plt.subplots(figsize=(12, 8))
    create_source_comparison_chart(ax, comparisons, colors)
    fig.suptitle('Data Sources Analysis', fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'04_source_comparison_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    # 5. Income Comparison
    fig, ax = plt.subplots(figsize=(12, 8))
    create_income_comparison_chart(ax, comparisons, colors)
    fig.suptitle('Monthly Income Suggestions', fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'05_income_comparison_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    # 6. Percentage Difference
    fig, ax = plt.subplots(figsize=(12, 8))
    create_percentage_difference_chart(ax, comparisons, colors)
    fig.suptitle('Percentage Difference Analysis', fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'06_percentage_difference_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    # 7. Summary Statistics
    fig, ax = plt.subplots(figsize=(12, 10))
    create_summary_stats(ax, comparisons, colors)
    fig.suptitle('Summary Statistics', fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'07_summary_stats_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    # 8. Detailed Rate Analysis
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
    create_detailed_rate_charts(ax1, ax2, comparisons, colors)
    fig.suptitle('Detailed Rate Progression Analysis', fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'08_detailed_rate_analysis_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    print(f"\n  {Colors.GREEN}✓ All individual charts saved to: {visual_dir}{Colors.END}\n")
    
    # Create combined PDF
    print(f"  {Colors.CYAN}Creating combined PDF report...{Colors.END}")
    create_combined_pdf(image_paths, visual_dir / f'FULL_REPORT_{timestamp}.pdf', comparisons)
    
    return visual_dir


def create_rate_comparison_chart(ax, comparisons, colors):
    """Create main hourly rate comparison bar chart"""
    levels = [c.experience_level for c in comparisons]
    with_rates = [c.with_rate or 0 for c in comparisons]
    without_rates = [c.without_rate or 0 for c in comparisons]
    
    x = np.arange(len(levels))
    width = 0.35
    
    bars1 = ax.bar(x - width/2, with_rates, width, label='With Grounding', 
                   color=colors['with'], alpha=0.8, edgecolor='black', linewidth=1.5)
    bars2 = ax.bar(x + width/2, without_rates, width, label='Without Grounding',
                   color=colors['without'], alpha=0.8, edgecolor='black', linewidth=1.5)
    
    # Add value labels on bars
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            if height > 5:  # Only show if rate is meaningful (> $5)
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'${height:.0f}',
                       ha='center', va='bottom', fontweight='bold', fontsize=9)
    
    ax.set_xlabel('Experience Level', fontsize=12, fontweight='bold')
    ax.set_ylabel('Hourly Rate ($)', fontsize=12, fontweight='bold')
    ax.set_title('Hourly Rate Comparison by Experience Level', fontsize=14, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(levels, rotation=0, ha='center')
    ax.legend(loc='upper left', fontsize=11, framealpha=0.95)
    ax.grid(True, alpha=0.3, axis='y')
    ax.set_axisbelow(True)


def create_rate_difference_chart(ax, comparisons, colors):
    """Create chart showing rate differences with clear explanations"""
    levels = [c.experience_level for c in comparisons]
    differences = [c.rate_difference or 0 for c in comparisons]
    
    # Get the actual rates for context
    with_rates = [c.with_rate or 0 for c in comparisons]
    without_rates = [c.without_rate or 0 for c in comparisons]
    
    bar_colors = [colors['positive'] if d > 0 else colors['negative'] if d < 0 else colors['neutral'] 
                  for d in differences]
    
    bars = ax.barh(levels, differences, color=bar_colors, alpha=0.8, edgecolor='black', linewidth=1.5)
    
    # Add detailed value labels showing the comparison
    for i, (bar, diff, with_r, without_r) in enumerate(zip(bars, differences, with_rates, without_rates)):
        if abs(diff) > 0.5:  # Only show if meaningful difference
            if diff > 0:
                # Grounding is higher
                label = f'${abs(diff):.2f} more\n(${with_r:.0f} vs ${without_r:.0f})'
                ha = 'left'
                x_pos = diff + 0.3
            else:
                # Grounding is lower  
                label = f'${abs(diff):.2f} less\n(${with_r:.0f} vs ${without_r:.0f})'
                ha = 'right'
                x_pos = diff - 0.3
            
            ax.text(x_pos, bar.get_y() + bar.get_height()/2, label,
                   ha=ha, va='center', fontweight='bold', fontsize=9,
                   bbox=dict(boxstyle='round,pad=0.4', facecolor='white', 
                            alpha=0.95, edgecolor='black', linewidth=1))
    
    ax.axvline(x=0, color='black', linestyle='-', linewidth=2)
    ax.set_xlabel('Rate Difference ($/hr)', fontsize=12, fontweight='bold')
    ax.set_title('Hourly Rate Difference\n(Positive = With Grounding gives MORE | Negative = With Grounding gives LESS)', 
                 fontsize=13, fontweight='bold', pad=20)
    ax.grid(True, alpha=0.3, axis='x')
    ax.set_axisbelow(True)
    
    # Add informative legend
    from matplotlib.lines import Line2D
    legend_elements = [
        Line2D([0], [0], color=colors['positive'], lw=8, label='With Grounding pays MORE'),
        Line2D([0], [0], color=colors['negative'], lw=8, label='With Grounding pays LESS')
    ]
    ax.legend(handles=legend_elements, loc='best', fontsize=10, framealpha=0.95)


def create_cost_comparison_chart(ax, comparisons, colors):
    """Create stacked bar chart for cost comparison"""
    levels = [c.experience_level for c in comparisons]
    
    with_sw = [c.with_software_cost or 0 for c in comparisons]
    with_ws = [c.with_workspace_cost or 0 for c in comparisons]
    without_sw = [c.without_software_cost or 0 for c in comparisons]
    without_ws = [c.without_workspace_cost or 0 for c in comparisons]
    
    x = np.arange(len(levels))
    width = 0.35
    
    # With grounding stacks
    p1 = ax.bar(x - width/2, with_sw, width, label='Software (With)', 
                color=colors['with'], alpha=0.9, edgecolor='black', linewidth=1)
    p2 = ax.bar(x - width/2, with_ws, width, bottom=with_sw, label='Workspace (With)',
                color=colors['with'], alpha=0.6, edgecolor='black', linewidth=1)
    
    # Without grounding stacks
    p3 = ax.bar(x + width/2, without_sw, width, label='Software (Without)',
                color=colors['without'], alpha=0.9, edgecolor='black', linewidth=1)
    p4 = ax.bar(x + width/2, without_ws, width, bottom=without_sw, label='Workspace (Without)',
                color=colors['without'], alpha=0.6, edgecolor='black', linewidth=1)
    
    ax.set_xlabel('Experience Level', fontsize=11, fontweight='bold')
    ax.set_ylabel('Monthly Cost ($)', fontsize=11, fontweight='bold')
    ax.set_title('Monthly Cost Estimates', fontsize=12, fontweight='bold', pad=15)
    ax.set_xticks(x)
    ax.set_xticklabels(levels, rotation=45, ha='right', fontsize=9)
    ax.legend(fontsize=8, loc='upper left', ncol=2)
    ax.grid(True, alpha=0.3, axis='y')
    ax.set_axisbelow(True)


def create_source_comparison_chart(ax, comparisons, colors):
    """Create chart comparing source counts"""
    levels = [c.experience_level for c in comparisons]
    with_sources = [c.with_sources_count for c in comparisons]
    without_sources = [c.without_sources_count for c in comparisons]
    
    x = np.arange(len(levels))
    width = 0.35
    
    bars1 = ax.bar(x - width/2, with_sources, width, label='With Grounding',
                   color=colors['with'], alpha=0.8, edgecolor='black', linewidth=1.5)
    bars2 = ax.bar(x + width/2, without_sources, width, label='Without Grounding',
                   color=colors['without'], alpha=0.8, edgecolor='black', linewidth=1.5)
    
    # Add value labels
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            if height > 0:  # Only show if there are sources
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{int(height)}',
                       ha='center', va='bottom', fontweight='bold', fontsize=9)
    
    ax.set_xlabel('Experience Level', fontsize=11, fontweight='bold')
    ax.set_ylabel('Number of Sources', fontsize=11, fontweight='bold')
    ax.set_title('Data Sources Count', fontsize=12, fontweight='bold', pad=15)
    ax.set_xticks(x)
    ax.set_xticklabels(levels, rotation=45, ha='right', fontsize=9)
    ax.legend(fontsize=9)
    ax.grid(True, alpha=0.3, axis='y')
    ax.set_axisbelow(True)


def create_income_comparison_chart(ax, comparisons, colors):
    """Create income suggestion comparison"""
    levels = [c.experience_level for c in comparisons]
    with_income = [c.with_income or 0 for c in comparisons]
    without_income = [c.without_income or 0 for c in comparisons]
    
    x = np.arange(len(levels))
    width = 0.35
    
    bars1 = ax.bar(x - width/2, with_income, width, label='With Grounding',
                   color=colors['with'], alpha=0.8, edgecolor='black', linewidth=1.5)
    bars2 = ax.bar(x + width/2, without_income, width, label='Without Grounding',
                   color=colors['without'], alpha=0.8, edgecolor='black', linewidth=1.5)
    
    # Add value labels
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            if height > 100:  # Only show if income is meaningful (> $100)
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'${height/1000:.0f}k',
                       ha='center', va='bottom', fontweight='bold', fontsize=8)
    
    ax.set_xlabel('Experience Level', fontsize=11, fontweight='bold')
    ax.set_ylabel('Monthly Income ($)', fontsize=11, fontweight='bold')
    ax.set_title('Suggested Monthly Income', fontsize=12, fontweight='bold', pad=15)
    ax.set_xticks(x)
    ax.set_xticklabels(levels, rotation=45, ha='right', fontsize=9)
    ax.legend(fontsize=9)
    ax.grid(True, alpha=0.3, axis='y')
    ax.set_axisbelow(True)


def create_percentage_difference_chart(ax, comparisons, colors):
    """Create percentage difference chart with crystal clear comparison labels"""
    levels = [c.experience_level for c in comparisons]
    percentages = [c.rate_diff_percent or 0 for c in comparisons]
    
    # Get actual rates for complete context
    with_rates = [c.with_rate or 0 for c in comparisons]
    without_rates = [c.without_rate or 0 for c in comparisons]
    
    bar_colors = [colors['positive'] if p > 0 else colors['negative'] if p < 0 else colors['neutral'] 
                  for p in percentages]
    
    bars = ax.barh(levels, percentages, color=bar_colors, alpha=0.8, edgecolor='black', linewidth=1.5)
    
    # Add comprehensive value labels
    for i, (bar, pct, with_r, without_r) in enumerate(zip(bars, percentages, with_rates, without_rates)):
        if abs(pct) > 1:  # Only show if meaningful
            if pct > 0:
                # With Grounding is higher
                label = f'{pct:.1f}% higher\nWith: ${with_r:.0f} vs Without: ${without_r:.0f}'
                ha = 'left'
                x_pos = pct + 1
            else:
                # With Grounding is lower
                label = f'{abs(pct):.1f}% lower\nWith: ${with_r:.0f} vs Without: ${without_r:.0f}'
                ha = 'right' 
                x_pos = pct - 1
            
            ax.text(x_pos, bar.get_y() + bar.get_height()/2, label,
                   ha=ha, va='center', fontweight='bold', fontsize=8,
                   bbox=dict(boxstyle='round,pad=0.4', facecolor='white', 
                            alpha=0.95, edgecolor='black', linewidth=1))
    
    ax.axvline(x=0, color='black', linestyle='-', linewidth=2)
    ax.set_xlabel('Percentage Difference (%)', fontsize=12, fontweight='bold')
    ax.set_title('Percentage Rate Difference\n(Positive = WITH Grounding is higher than WITHOUT | Negative = WITH Grounding is lower)', 
                 fontsize=11, fontweight='bold', pad=20)
    ax.grid(True, alpha=0.3, axis='x')
    ax.set_axisbelow(True)
    
    # Add clear legend
    from matplotlib.lines import Line2D
    legend_elements = [
        Line2D([0], [0], color=colors['positive'], lw=8, label='WITH Grounding = Higher Rate'),
        Line2D([0], [0], color=colors['negative'], lw=8, label='WITH Grounding = Lower Rate')
    ]
    ax.legend(handles=legend_elements, loc='best', fontsize=9, framealpha=0.95)


def create_summary_stats(ax, comparisons, colors):
    """Create summary statistics panel"""
    ax.axis('off')
    
    # Calculate statistics
    with_rates = [c.with_rate for c in comparisons if c.with_rate]
    without_rates = [c.without_rate for c in comparisons if c.without_rate]
    
    with_urls = sum(1 for c in comparisons if c.with_has_urls)
    without_urls = sum(1 for c in comparisons if c.without_has_urls)
    
    stats_text = "SUMMARY STATISTICS\n" + "="*40 + "\n\n"
    
    if with_rates and without_rates:
        avg_with = sum(with_rates) / len(with_rates)
        avg_without = sum(without_rates) / len(without_rates)
        avg_diff = avg_with - avg_without
        avg_diff_pct = (avg_diff / avg_without) * 100 if avg_without > 0 else 0
        
        stats_text += f"Average Hourly Rates:\n"
        stats_text += f"  • With Grounding:    ${avg_with:.2f}\n"
        stats_text += f"  • Without Grounding: ${avg_without:.2f}\n"
        stats_text += f"  • Difference:        ${avg_diff:+.2f} ({avg_diff_pct:+.1f}%)\n\n"
        
        stats_text += f"Rate Range:\n"
        stats_text += f"  • With:    ${min(with_rates):.2f} - ${max(with_rates):.2f}\n"
        stats_text += f"  • Without: ${min(without_rates):.2f} - ${max(without_rates):.2f}\n\n"
    
    stats_text += f"Source Analysis:\n"
    stats_text += f"  • With web URLs (Grounding):  {with_urls}/{len(comparisons)}\n"
    stats_text += f"  • With web URLs (No Ground.): {without_urls}/{len(comparisons)}\n\n"
    
    # Grounding effectiveness
    if with_urls > without_urls:
        stats_text += "✓ Grounding providing real web sources"
    elif with_urls == without_urls and with_urls > 0:
        stats_text += "⚠ Similar URL counts detected"
    else:
        stats_text += "⚠ No clear grounding advantage"
    
    ax.text(0.05, 0.95, stats_text, transform=ax.transAxes,
           fontsize=10, verticalalignment='top', fontfamily='monospace',
           bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.3))


def create_detailed_rate_charts(ax1, ax2, comparisons, colors):
    """Create detailed rate analysis charts"""
    levels = [c.experience_level for c in comparisons]
    with_rates = [c.with_rate or 0 for c in comparisons]
    without_rates = [c.without_rate or 0 for c in comparisons]
    
    # Line chart
    ax1.plot(levels, with_rates, 'o-', label='With Grounding', 
            color=colors['with'], linewidth=3, markersize=10, markeredgecolor='black', markeredgewidth=2)
    ax1.plot(levels, without_rates, 's-', label='Without Grounding',
            color=colors['without'], linewidth=3, markersize=10, markeredgecolor='black', markeredgewidth=2)
    
    ax1.set_xlabel('Experience Level', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Hourly Rate ($)', fontsize=12, fontweight='bold')
    ax1.set_title('Rate Progression Across Experience Levels', fontsize=14, fontweight='bold')
    ax1.legend(fontsize=11)
    ax1.grid(True, alpha=0.3)
    ax1.set_axisbelow(True)
    
    # Scatter plot with trend
    x_pos = np.arange(len(levels))
    ax2.scatter(x_pos, with_rates, s=200, alpha=0.6, color=colors['with'], 
               edgecolors='black', linewidth=2, label='With Grounding')
    ax2.scatter(x_pos, without_rates, s=200, alpha=0.6, color=colors['without'],
               edgecolors='black', linewidth=2, label='Without Grounding', marker='s')
    
    # Add trend lines
    if len(with_rates) > 1:
        z1 = np.polyfit(x_pos, with_rates, 1)
        p1 = np.poly1d(z1)
        ax2.plot(x_pos, p1(x_pos), "--", color=colors['with'], alpha=0.8, linewidth=2)
        
        z2 = np.polyfit(x_pos, without_rates, 1)
        p2 = np.poly1d(z2)
        ax2.plot(x_pos, p2(x_pos), "--", color=colors['without'], alpha=0.8, linewidth=2)
    
    ax2.set_xticks(x_pos)
    ax2.set_xticklabels(levels, rotation=45, ha='right')
    ax2.set_xlabel('Experience Level', fontsize=12, fontweight='bold')
    ax2.set_ylabel('Hourly Rate ($)', fontsize=12, fontweight='bold')
    ax2.set_title('Rate Distribution with Trends', fontsize=14, fontweight='bold')
    ax2.legend(fontsize=11)
    ax2.grid(True, alpha=0.3)
    ax2.set_axisbelow(True)


def create_combined_pdf(image_paths: List[Path], output_path: Path, comparisons: List[ComparisonResult]):
    """Combine all images into a single PDF report with beautiful, well-spaced cover page"""
    from matplotlib.backends.backend_pdf import PdfPages
    
    with PdfPages(output_path) as pdf:
        # Create professional cover page with proper spacing
        fig = plt.figure(figsize=(8.5, 11))
        fig.patch.set_facecolor('white')
        ax = fig.add_subplot(111)
        ax.axis('off')
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        
        # Calculate statistics
        with_rates = [c.with_rate for c in comparisons if c.with_rate]
        without_rates = [c.without_rate for c in comparisons if c.without_rate]
        
        # Title section with colored box
        title_box = plt.Rectangle((0.08, 0.85), 0.84, 0.11, 
                                  facecolor='#2E86AB', edgecolor='black', 
                                  linewidth=2.5, transform=ax.transAxes, zorder=1)
        ax.add_patch(title_box)
        
        ax.text(0.5, 0.935, 'Quick Estimate API', 
               transform=ax.transAxes, fontsize=26, fontweight='bold',
               ha='center', va='top', color='white', zorder=2)
        ax.text(0.5, 0.885, 'Comparison Report', 
               transform=ax.transAxes, fontsize=26, fontweight='bold',
               ha='center', va='top', color='white', zorder=2)
        
        # Subtitle - moved up slightly
        ax.text(0.5, 0.81, 'Google Search Grounding vs Knowledge Base', 
               transform=ax.transAxes, fontsize=12, style='italic',
               ha='center', va='top', color='#333333')
        
        # Decorative line
        ax.plot([0.1, 0.9], [0.79, 0.79], 'k-', linewidth=1.5, transform=ax.transAxes)
        
        # Main statistics section
        if with_rates and without_rates:
            avg_with = sum(with_rates) / len(with_rates)
            avg_without = sum(without_rates) / len(without_rates)
            avg_diff = avg_with - avg_without
            avg_diff_pct = (avg_diff / avg_without) * 100 if avg_without > 0 else 0
            
            # Statistics title
            ax.text(0.5, 0.75, 'KEY FINDINGS', 
                   transform=ax.transAxes, fontsize=15, fontweight='bold',
                   ha='center', va='top', color='#2E86AB')
            
            # Create boxes for statistics - adjusted positions
            y_start = 0.69
            box_height = 0.08
            
            # With Grounding box
            with_box = plt.Rectangle((0.1, y_start - box_height), 0.35, box_height,
                                    facecolor='#E8F4F8', edgecolor='#2E86AB',
                                    linewidth=2, transform=ax.transAxes)
            ax.add_patch(with_box)
            
            ax.text(0.275, y_start - 0.015, 'With Grounding', 
                   transform=ax.transAxes, fontsize=10, fontweight='bold',
                   ha='center', va='top', color='#2E86AB')
            ax.text(0.275, y_start - 0.048, f'${avg_with:.2f}/hr', 
                   transform=ax.transAxes, fontsize=16, fontweight='bold',
                   ha='center', va='top', color='#1a4d6b')
            
            # Without Grounding box
            without_box = plt.Rectangle((0.55, y_start - box_height), 0.35, box_height,
                                       facecolor='#F8E8F4', edgecolor='#A23B72',
                                       linewidth=2, transform=ax.transAxes)
            ax.add_patch(without_box)
            
            ax.text(0.725, y_start - 0.015, 'Without Grounding', 
                   transform=ax.transAxes, fontsize=10, fontweight='bold',
                   ha='center', va='top', color='#A23B72')
            ax.text(0.725, y_start - 0.048, f'${avg_without:.2f}/hr', 
                   transform=ax.transAxes, fontsize=16, fontweight='bold',
                   ha='center', va='top', color='#6b1a47')
            
            # Difference box (centered, larger) - adjusted position
            diff_y = y_start - box_height - 0.06
            diff_color = '#06A77D' if avg_diff > 0 else '#D84654'
            diff_bg = '#E8F8F4' if avg_diff > 0 else '#F8E8E8'
            
            diff_box = plt.Rectangle((0.18, diff_y - box_height * 1.1), 0.64, box_height * 1.1,
                                    facecolor=diff_bg, edgecolor=diff_color,
                                    linewidth=2.5, transform=ax.transAxes)
            ax.add_patch(diff_box)
            
            ax.text(0.5, diff_y - 0.015, 'Average Difference', 
                   transform=ax.transAxes, fontsize=11, fontweight='bold',
                   ha='center', va='top', color=diff_color)
            
            diff_sign = '+' if avg_diff > 0 else ''
            ax.text(0.5, diff_y - 0.045, f'{diff_sign}${avg_diff:.2f}/hr', 
                   transform=ax.transAxes, fontsize=19, fontweight='bold',
                   ha='center', va='top', color=diff_color)
            ax.text(0.5, diff_y - 0.078, f'({diff_sign}{avg_diff_pct:.1f}%)', 
                   transform=ax.transAxes, fontsize=14, fontweight='bold',
                   ha='center', va='top', color=diff_color)
        
        # Additional info section - adjusted position
        info_y = 0.38
        ax.text(0.5, info_y, 'REPORT DETAILS', 
               transform=ax.transAxes, fontsize=13, fontweight='bold',
               ha='center', va='top', color='#2E86AB')
        
        info_box = plt.Rectangle((0.15, info_y - 0.14), 0.7, 0.12,
                                facecolor='#F5F5F5', edgecolor='#CCCCCC',
                                linewidth=1.5, transform=ax.transAxes)
        ax.add_patch(info_box)
        
        # Get experience levels
        exp_levels = ', '.join([c.experience_level.title() for c in comparisons])
        
        info_text = f"Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}\n\n"
        info_text += f"Scenarios Compared: {len(comparisons)}\n"
        info_text += f"Charts Included: {len(image_paths)}\n\n"
        info_text += f"Experience Levels:\n{exp_levels}"
        
        ax.text(0.5, info_y - 0.018, info_text,
               transform=ax.transAxes, fontsize=9,
               ha='center', va='top', color='#333333',
               linespacing=1.5, family='sans-serif')
        
        # Footer with interpretation guide - adjusted position
        footer_y = 0.18
        ax.text(0.5, footer_y, 'INTERPRETATION GUIDE', 
               transform=ax.transAxes, fontsize=12, fontweight='bold',
               ha='center', va='top', color='#666666')
        
        guide_box = plt.Rectangle((0.12, footer_y - 0.095), 0.76, 0.08,
                                 facecolor='#FFFEF0', edgecolor='#F18F01',
                                 linewidth=1.5, transform=ax.transAxes)
        ax.add_patch(guide_box)
        
        guide_text = "🟦 Blue = With Grounding  |  🟪 Purple = Without Grounding\n"
        guide_text += "🟢 Green = Grounding Higher  |  🔴 Red = Grounding Lower"
        
        ax.text(0.5, footer_y - 0.018, guide_text,
               transform=ax.transAxes, fontsize=9,
               ha='center', va='top', color='#333333',
               linespacing=1.6)
        
        # Footer note
        ax.text(0.5, 0.06, 'This report compares rate estimates with real-time web data (Grounding)\nvs AI knowledge base only (Without Grounding)',
               transform=ax.transAxes, fontsize=8, style='italic',
               ha='center', va='top', color='#666666',
               linespacing=1.4)
        
        # Page number
        ax.text(0.5, 0.02, 'Page 1',
               transform=ax.transAxes, fontsize=9,
               ha='center', va='bottom', color='#999999')
        
        pdf.savefig(fig, bbox_inches='tight')
        plt.close()
        
        # Add each chart image with page numbers
        for idx, img_path in enumerate(image_paths, start=2):
            img = plt.imread(str(img_path))
            fig = plt.figure(figsize=(8.5, 11))
            
            # Add chart
            ax = fig.add_subplot(111)
            ax.imshow(img)
            ax.axis('off')
            
            # Add page number
            fig.text(0.5, 0.02, f'Page {idx} of {len(image_paths) + 1}',
                    ha='center', va='bottom', fontsize=9, color='#999999')
            
            pdf.savefig(fig, bbox_inches='tight')
            plt.close()
        
        # Set PDF metadata
        d = pdf.infodict()
        d['Title'] = 'Quick Estimate API Comparison Report'
        d['Author'] = 'Quick Estimate Comparison Tool'
        d['Subject'] = 'Google Search Grounding vs Knowledge Base Analysis'
        d['Keywords'] = 'API, Grounding, Comparison, Rates, Hourly, Freelance'
        d['CreationDate'] = datetime.now()
    
    print(f"  {Colors.GREEN}✓ Combined PDF saved to: {output_path}{Colors.END}\n")


def print_header():
    """Print report header"""
    print()
    print(f"{Colors.CYAN}╔══════════════════════════════════════════════════════════════════════════╗{Colors.END}")
    print(f"{Colors.CYAN}║     Quick Estimate Comparison: Google Search Grounding vs Knowledge     ║{Colors.END}")
    print(f"{Colors.CYAN}╚══════════════════════════════════════════════════════════════════════════╝{Colors.END}")
    print()


def print_comparison_table(comparisons: List[ComparisonResult]):
    """Print main comparison table"""
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}  HOURLY RATE COMPARISON{Colors.END}")
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    print()
    
    # Header
    print(f"  {'Level':<15} {'With Grounding':>15} {'Without':>15} {'Difference':>15} {'% Diff':>10}")
    print(f"  {'-'*15} {'-'*15} {'-'*15} {'-'*15} {'-'*10}")
    
    for c in comparisons:
        with_str = f"${c.with_rate:.2f}/hr" if c.with_rate else "N/A"
        without_str = f"${c.without_rate:.2f}/hr" if c.without_rate else "N/A"
        
        if c.rate_difference is not None:
            diff_str = f"${c.rate_difference:+.2f}"
            pct_str = f"{c.rate_diff_percent:+.1f}%"
            
            if c.rate_difference > 0:
                diff_color = Colors.GREEN
            elif c.rate_difference < 0:
                diff_color = Colors.RED
            else:
                diff_color = Colors.YELLOW
        else:
            diff_str = "N/A"
            pct_str = "N/A"
            diff_color = Colors.YELLOW
        
        print(f"  {c.experience_level:<15} {with_str:>15} {without_str:>15} {diff_color}{diff_str:>15}{Colors.END} {diff_color}{pct_str:>10}{Colors.END}")
    
    print()


def print_cost_comparison(comparisons: List[ComparisonResult]):
    """Print cost breakdown comparison"""
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}  MONTHLY COST ESTIMATES{Colors.END}")
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    print()
    
    print(f"  {'Level':<15} {'Software (W/WO)':>20} {'Workspace (W/WO)':>20} {'Income (W/WO)':>20}")
    print(f"  {'-'*15} {'-'*20} {'-'*20} {'-'*20}")
    
    for c in comparisons:
        sw_with = f"${c.with_software_cost:.0f}" if c.with_software_cost else "N/A"
        sw_without = f"${c.without_software_cost:.0f}" if c.without_software_cost else "N/A"
        
        ws_with = f"${c.with_workspace_cost:.0f}" if c.with_workspace_cost else "N/A"
        ws_without = f"${c.without_workspace_cost:.0f}" if c.without_workspace_cost else "N/A"
        
        inc_with = f"${c.with_income:.0f}" if c.with_income else "N/A"
        inc_without = f"${c.without_income:.0f}" if c.without_income else "N/A"
        
        print(f"  {c.experience_level:<15} {sw_with:>8}/{sw_without:<10} {ws_with:>8}/{ws_without:<10} {inc_with:>8}/{inc_without:<10}")
    
    print()


def print_source_comparison(comparisons: List[ComparisonResult]):
    """Print source count comparison"""
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}  DATA SOURCES ANALYSIS{Colors.END}")
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    print()
    
    print(f"  {'Level':<15} {'With Grounding':>20} {'Without Grounding':>20} {'Web URLs':>15}")
    print(f"  {'-'*15} {'-'*20} {'-'*20} {'-'*15}")
    
    for c in comparisons:
        with_sources = f"{c.with_sources_count} sources"
        without_sources = f"{c.without_sources_count} sources"
        
        if c.with_has_urls:
            url_status = f"{Colors.GREEN}✓ YES{Colors.END}"
        else:
            url_status = f"{Colors.YELLOW}✗ NO{Colors.END}"
        
        print(f"  {c.experience_level:<15} {with_sources:>20} {without_sources:>20} {url_status:>15}")
    
    print()


def print_insights(comparisons: List[ComparisonResult], with_data: Dict, without_data: Dict):
    """Print analysis insights"""
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}  KEY INSIGHTS{Colors.END}")
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    print()
    
    # Calculate averages
    with_rates = [c.with_rate for c in comparisons if c.with_rate]
    without_rates = [c.without_rate for c in comparisons if c.without_rate]
    
    if with_rates and without_rates:
        avg_with = sum(with_rates) / len(with_rates)
        avg_without = sum(without_rates) / len(without_rates)
        avg_diff = avg_with - avg_without
        avg_diff_pct = (avg_diff / avg_without) * 100 if avg_without > 0 else 0
        
        print(f"  {Colors.CYAN}Average Rates:{Colors.END}")
        print(f"    • With Grounding:    ${avg_with:.2f}/hr")
        print(f"    • Without Grounding: ${avg_without:.2f}/hr")
        print(f"    • Difference:        ${avg_diff:+.2f}/hr ({avg_diff_pct:+.1f}%)")
        print()
    
    # Source analysis
    with_urls = sum(1 for c in comparisons if c.with_has_urls)
    without_urls = sum(1 for c in comparisons if c.without_has_urls)
    
    print(f"  {Colors.CYAN}Source Quality:{Colors.END}")
    print(f"    • With Grounding has web URLs:    {with_urls}/{len(comparisons)} scenarios")
    print(f"    • Without Grounding has web URLs: {without_urls}/{len(comparisons)} scenarios")
    print()
    
    # Grounding effectiveness
    if with_urls > without_urls:
        print(f"  {Colors.GREEN}✓ Google Search Grounding is providing real web sources{Colors.END}")
    elif with_urls == without_urls and with_urls > 0:
        print(f"  {Colors.YELLOW}⚠ Both modes showing web URLs - grounding may be active in both{Colors.END}")
    else:
        print(f"  {Colors.YELLOW}⚠ No web URLs detected - grounding may not be active{Colors.END}")
    
    print()


def print_detailed_sources(with_data: Dict, without_data: Dict):
    """Print detailed source listings"""
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}  DETAILED SOURCES{Colors.END}")
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    print()
    
    for result in with_data.get('results', []):
        if result.get('success'):
            print(f"  {Colors.CYAN}{result.get('experience_level', 'Unknown').upper()}{Colors.END}")
            print(f"  {'-'*40}")
            
            sources = result.get('sources', [])
            if sources:
                print(f"  {Colors.GREEN}With Grounding:{Colors.END}")
                for src in sources[:5]:  # Limit to 5
                    if 'http' in str(src):
                        print(f"    🌐 {src}")
                    else:
                        print(f"    📚 {src}")
            print()
    
    print()


def save_comparison_report(comparisons: List[ComparisonResult], output_path: str):
    """Save comparison data to JSON file"""
    report = {
        'generated_at': datetime.now().isoformat(),
        'comparisons': []
    }
    
    for c in comparisons:
        report['comparisons'].append({
            'experience_level': c.experience_level,
            'skills': c.skills,
            'with_grounding': {
                'rate': c.with_rate,
                'sources_count': c.with_sources_count,
                'has_web_urls': c.with_has_urls,
                'software_cost': c.with_software_cost,
                'workspace_cost': c.with_workspace_cost,
                'suggested_income': c.with_income
            },
            'without_grounding': {
                'rate': c.without_rate,
                'sources_count': c.without_sources_count,
                'has_web_urls': c.without_has_urls,
                'software_cost': c.without_software_cost,
                'workspace_cost': c.without_workspace_cost,
                'suggested_income': c.without_income
            },
            'difference': {
                'rate_absolute': c.rate_difference,
                'rate_percent': c.rate_diff_percent
            }
        })
    
    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"  {Colors.GREEN}✓ Comparison report saved to: {output_path}{Colors.END}")


def main():
    """Main entry point"""
    script_dir = Path(__file__).parent
    results_dir = script_dir / 'results'
    
    # Check for graphs-only mode
    graphs_only = '--graphs-only' in sys.argv
    
    # Determine input files
    if len(sys.argv) >= 3 and not graphs_only:
        with_grounding_file = sys.argv[1]
        without_grounding_file = sys.argv[2]
    else:
        # Use latest results
        with_grounding_file = results_dir / 'latest_with_grounding.json'
        without_grounding_file = results_dir / 'latest_without_grounding.json'
        
        if not with_grounding_file.exists() or not without_grounding_file.exists():
            print(f"{Colors.RED}Error: No result files found.{Colors.END}")
            print(f"Run the test script first: ./quick-estimate-test.sh")
            print(f"Or specify files: python3 compare_results.py <with.json> <without.json>")
            sys.exit(1)
    
    # Load data
    print(f"Loading: {with_grounding_file}")
    with_data = load_json_file(str(with_grounding_file))
    
    print(f"Loading: {without_grounding_file}")
    without_data = load_json_file(str(without_grounding_file))
    
    # Compare
    comparisons = compare_results(with_data, without_data)
    
    # Print report (unless graphs-only mode)
    if not graphs_only:
        print_header()
        print(f"  With Grounding Test:    {with_data.get('timestamp', 'N/A')}")
        print(f"  Without Grounding Test: {without_data.get('timestamp', 'N/A')}")
        print()
        
        print_comparison_table(comparisons)
        print_cost_comparison(comparisons)
        print_source_comparison(comparisons)
        print_insights(comparisons, with_data, without_data)
        print_detailed_sources(with_data, without_data)
    
    # Generate visualizations
    print()
    print(f"{Colors.BOLD}Generating visualizations...{Colors.END}")
    results_dir.mkdir(exist_ok=True)
    visual_dir = create_visualizations(comparisons, results_dir)
    
    # Save report (unless graphs-only mode)
    if not graphs_only:
        report_path = results_dir / f'comparison_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        save_comparison_report(comparisons, str(report_path))
    
    print()
    print(f"{Colors.CYAN}{'='*80}{Colors.END}")
    print(f"{Colors.GREEN}✓ Comparison complete!{Colors.END}")
    print(f"{Colors.CYAN}{'='*80}{Colors.END}")
    print()
    print(f"  📊 Individual charts: {visual_dir}/")
    print(f"  📄 Combined PDF:      {visual_dir}/FULL_REPORT_*.pdf")
    if not graphs_only:
        print(f"  📋 JSON report:       {report_path}")
    print()


if __name__ == '__main__':
    main()