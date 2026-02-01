#!/usr/bin/env python3
"""
Single Result Visualizer for Quick Estimate API Tests

Visualizes results from a single quick estimate API test run.
Works with both grounded and non-grounded results.

Usage:
    python3 visualize_single.py <result_file.json>
    python3 visualize_single.py  # Uses latest_with_grounding.json
"""

import json
import sys
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
class ScenarioResult:
    """Holds data for a single test scenario"""
    experience_level: str
    skills: str
    success: bool
    rate: Optional[float]
    software_cost: Optional[float]
    workspace_cost: Optional[float]
    equipment_cost: Optional[float]
    total_expenses: Optional[float]
    suggested_income: Optional[float]
    sources_count: int
    has_web_urls: bool
    sources: List[str]
    market_median: Optional[float]
    market_position: Optional[str]


def load_json_file(filepath: str) -> Dict[str, Any]:
    """Load and parse a JSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)


def parse_results(data: Dict[str, Any]) -> List[ScenarioResult]:
    """Parse JSON data into ScenarioResult objects"""
    scenarios = []
    
    for result in data.get('results', []):
        estimate = result.get('estimate', {})
        costs = result.get('ai_researched_costs', {})
        income_data = result.get('ai_researched_income', {})
        market = result.get('market_research', {})
        
        scenario = ScenarioResult(
            experience_level=result.get('experience_level', 'Unknown'),
            skills=result.get('skills', 'N/A'),
            success=result.get('success', False),
            rate=estimate.get('recommended_rate'),
            software_cost=costs.get('monthly_software_cost'),
            workspace_cost=costs.get('monthly_workspace_cost'),
            equipment_cost=costs.get('monthly_equipment_cost'),
            total_expenses=costs.get('total_monthly_expenses'),
            suggested_income=income_data.get('suggested_monthly_income'),
            sources_count=result.get('sources_count', 0),
            has_web_urls=result.get('has_web_urls', False),
            sources=result.get('sources', []),
            market_median=market.get('median_rate'),
            market_position=market.get('position')
        )
        scenarios.append(scenario)
    
    return scenarios


def create_visualizations(scenarios: List[ScenarioResult], metadata: Dict, output_dir: Path):
    """Create all visualization graphs"""
    plt.style.use('seaborn-v0_8-darkgrid')
    
    # Color scheme
    colors = {
        'primary': '#2E86AB',
        'secondary': '#06A77D',
        'accent': '#F18F01',
        'danger': '#D84654',
        'neutral': '#6C757D'
    }
    
    visual_dir = output_dir / 'single_visual'
    visual_dir.mkdir(exist_ok=True, parents=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    test_type = "with_grounding" if metadata.get('grounding_enabled', True) else "without_grounding"
    
    print(f"\n  {Colors.CYAN}Generating visualization charts...{Colors.END}\n")
    
    image_paths = []
    
    # 1. Hourly Rates Chart
    fig, ax = plt.subplots(figsize=(14, 8))
    create_rates_chart(ax, scenarios, colors)
    title = 'Hourly Rates by Experience Level'
    if metadata.get('grounding_enabled') is not None:
        title += f" ({'With' if metadata['grounding_enabled'] else 'Without'} Google Search Grounding)"
    fig.suptitle(title, fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'01_hourly_rates_{test_type}_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    # 2. Cost Breakdown Chart
    fig, ax = plt.subplots(figsize=(14, 8))
    create_cost_breakdown_chart(ax, scenarios, colors)
    fig.suptitle('Monthly Cost Breakdown', fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'02_cost_breakdown_{test_type}_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    # 3. Income vs Expenses Chart
    fig, ax = plt.subplots(figsize=(14, 8))
    create_income_vs_expenses_chart(ax, scenarios, colors)
    fig.suptitle('Monthly Income vs Total Expenses', fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'03_income_vs_expenses_{test_type}_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    # 4. Rate Progression Chart
    fig, ax = plt.subplots(figsize=(14, 8))
    create_rate_progression_chart(ax, scenarios, colors)
    fig.suptitle('Rate Progression & Market Position', fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'04_rate_progression_{test_type}_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    # 5. Sources Analysis Chart
    fig, ax = plt.subplots(figsize=(12, 8))
    create_sources_chart(ax, scenarios, colors)
    fig.suptitle('Data Sources Analysis', fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'05_sources_analysis_{test_type}_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    # 6. Rate Distribution Chart
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
    create_rate_distribution_charts(ax1, ax2, scenarios, colors)
    fig.suptitle('Rate Distribution Analysis', fontsize=18, fontweight='bold', y=0.98)
    path = visual_dir / f'06_rate_distribution_{test_type}_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    # 7. Summary Dashboard
    fig = plt.figure(figsize=(16, 10))
    create_summary_dashboard(fig, scenarios, metadata, colors)
    fig.suptitle('Summary Dashboard', fontsize=20, fontweight='bold', y=0.98)
    path = visual_dir / f'07_summary_dashboard_{test_type}_{timestamp}.png'
    plt.savefig(path, dpi=300, bbox_inches='tight', facecolor='white')
    image_paths.append(path)
    print(f"  ✓ Saved: {path.name}")
    plt.close()
    
    print(f"\n  {Colors.GREEN}✓ All charts saved to: {visual_dir}{Colors.END}\n")
    
    # Create combined PDF
    print(f"  {Colors.CYAN}Creating combined PDF report...{Colors.END}")
    create_combined_pdf(image_paths, visual_dir / f'REPORT_{test_type}_{timestamp}.pdf', 
                       scenarios, metadata)
    
    return visual_dir


def create_rates_chart(ax, scenarios, colors):
    """Create main hourly rates bar chart"""
    levels = [s.experience_level for s in scenarios if s.success]
    rates = [s.rate or 0 for s in scenarios if s.success]
    
    bars = ax.bar(levels, rates, color=colors['primary'], alpha=0.8, 
                  edgecolor='black', linewidth=2)
    
    # Add value labels
    for bar in bars:
        height = bar.get_height()
        if height > 0:
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'${height:.2f}/hr',
                   ha='center', va='bottom', fontweight='bold', fontsize=11)
    
    ax.set_xlabel('Experience Level', fontsize=13, fontweight='bold')
    ax.set_ylabel('Hourly Rate ($)', fontsize=13, fontweight='bold')
    ax.set_title('Recommended Hourly Rates', fontsize=15, fontweight='bold', pad=20)
    ax.grid(True, alpha=0.3, axis='y')
    ax.set_axisbelow(True)
    
    # Calculate and show average
    if rates:
        avg_rate = sum(rates) / len(rates)
        ax.axhline(y=avg_rate, color=colors['accent'], linestyle='--', 
                  linewidth=2, label=f'Average: ${avg_rate:.2f}/hr')
        ax.legend(fontsize=11)


def create_cost_breakdown_chart(ax, scenarios, colors):
    """Create stacked bar chart for cost breakdown"""
    levels = [s.experience_level for s in scenarios if s.success]
    software = [s.software_cost or 0 for s in scenarios if s.success]
    workspace = [s.workspace_cost or 0 for s in scenarios if s.success]
    equipment = [s.equipment_cost or 0 for s in scenarios if s.success]
    
    x = np.arange(len(levels))
    width = 0.6
    
    p1 = ax.bar(x, software, width, label='Software', 
                color=colors['primary'], alpha=0.9, edgecolor='black', linewidth=1.5)
    p2 = ax.bar(x, workspace, width, bottom=software, label='Workspace',
                color=colors['secondary'], alpha=0.9, edgecolor='black', linewidth=1.5)
    p3 = ax.bar(x, equipment, width, bottom=np.array(software) + np.array(workspace),
                label='Equipment', color=colors['accent'], alpha=0.9, 
                edgecolor='black', linewidth=1.5)
    
    # Add total labels
    totals = [s.total_expenses or 0 for s in scenarios if s.success]
    for i, total in enumerate(totals):
        if total > 0:
            ax.text(i, total, f'${total:.0f}',
                   ha='center', va='bottom', fontweight='bold', fontsize=10)
    
    ax.set_xlabel('Experience Level', fontsize=13, fontweight='bold')
    ax.set_ylabel('Monthly Cost ($)', fontsize=13, fontweight='bold')
    ax.set_title('Monthly Operational Costs', fontsize=15, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(levels, rotation=0)
    ax.legend(fontsize=11, loc='upper left')
    ax.grid(True, alpha=0.3, axis='y')
    ax.set_axisbelow(True)


def create_income_vs_expenses_chart(ax, scenarios, colors):
    """Create chart comparing income vs expenses"""
    levels = [s.experience_level for s in scenarios if s.success]
    income = [s.suggested_income or 0 for s in scenarios if s.success]
    expenses = [s.total_expenses or 0 for s in scenarios if s.success]
    
    x = np.arange(len(levels))
    width = 0.35
    
    bars1 = ax.bar(x - width/2, income, width, label='Suggested Income',
                   color=colors['secondary'], alpha=0.8, edgecolor='black', linewidth=2)
    bars2 = ax.bar(x + width/2, expenses, width, label='Total Expenses',
                   color=colors['danger'], alpha=0.8, edgecolor='black', linewidth=2)
    
    # Add value labels
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            if height > 0:
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'${height/1000:.1f}k',
                       ha='center', va='bottom', fontweight='bold', fontsize=9)
    
    # Add profit margin annotations
    for i, (inc, exp) in enumerate(zip(income, expenses)):
        if inc > 0 and exp > 0:
            profit = inc - exp
            margin = (profit / inc) * 100
            y_pos = max(inc, exp) * 1.05
            color = colors['secondary'] if profit > 0 else colors['danger']
            ax.text(i, y_pos, f'{margin:.0f}% margin',
                   ha='center', va='bottom', fontsize=8, fontweight='bold',
                   color=color)
    
    ax.set_xlabel('Experience Level', fontsize=13, fontweight='bold')
    ax.set_ylabel('Monthly Amount ($)', fontsize=13, fontweight='bold')
    ax.set_title('Income vs Expenses Analysis', fontsize=15, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(levels, rotation=0)
    ax.legend(fontsize=11)
    ax.grid(True, alpha=0.3, axis='y')
    ax.set_axisbelow(True)


def create_rate_progression_chart(ax, scenarios, colors):
    """Create line chart showing rate progression"""
    levels = [s.experience_level for s in scenarios if s.success]
    rates = [s.rate or 0 for s in scenarios if s.success]
    market_medians = [s.market_median or 0 for s in scenarios if s.success]
    
    x = np.arange(len(levels))
    
    # Plot actual rates
    ax.plot(x, rates, 'o-', label='Recommended Rate', 
           color=colors['primary'], linewidth=3, markersize=12,
           markeredgecolor='black', markeredgewidth=2)
    
    # Plot market medians if available
    if any(market_medians):
        ax.plot(x, market_medians, 's--', label='Market Median',
               color=colors['accent'], linewidth=2.5, markersize=10,
               markeredgecolor='black', markeredgewidth=1.5, alpha=0.7)
    
    # Add value labels
    for i, (rate, level) in enumerate(zip(rates, levels)):
        if rate > 0:
            ax.text(i, rate, f'${rate:.2f}',
                   ha='center', va='bottom', fontweight='bold', fontsize=10,
                   bbox=dict(boxstyle='round,pad=0.3', facecolor='white', 
                            alpha=0.8, edgecolor=colors['primary'], linewidth=1.5))
    
    ax.set_xlabel('Experience Level', fontsize=13, fontweight='bold')
    ax.set_ylabel('Hourly Rate ($)', fontsize=13, fontweight='bold')
    ax.set_title('Rate Progression Across Experience Levels', fontsize=15, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(levels, rotation=0)
    ax.legend(fontsize=11)
    ax.grid(True, alpha=0.3)
    ax.set_axisbelow(True)


def create_sources_chart(ax, scenarios, colors):
    """Create chart showing source counts and web URL presence"""
    levels = [s.experience_level for s in scenarios if s.success]
    source_counts = [s.sources_count for s in scenarios if s.success]
    has_urls = [s.has_web_urls for s in scenarios if s.success]
    
    # Create bars
    bar_colors = [colors['secondary'] if has_url else colors['neutral'] 
                  for has_url in has_urls]
    
    bars = ax.bar(levels, source_counts, color=bar_colors, alpha=0.8,
                  edgecolor='black', linewidth=2)
    
    # Add value labels and URL indicators
    for bar, count, has_url in zip(bars, source_counts, has_urls):
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
               f'{count}\n{"🌐 Web" if has_url else "📚 KB"}',
               ha='center', va='bottom', fontweight='bold', fontsize=10)
    
    ax.set_xlabel('Experience Level', fontsize=13, fontweight='bold')
    ax.set_ylabel('Number of Sources', fontsize=13, fontweight='bold')
    ax.set_title('Data Sources Count & Type', fontsize=15, fontweight='bold', pad=20)
    ax.grid(True, alpha=0.3, axis='y')
    ax.set_axisbelow(True)
    
    # Add legend
    from matplotlib.lines import Line2D
    legend_elements = [
        Line2D([0], [0], color=colors['secondary'], lw=8, label='Has Web URLs'),
        Line2D([0], [0], color=colors['neutral'], lw=8, label='Knowledge Base Only')
    ]
    ax.legend(handles=legend_elements, fontsize=10, loc='upper left')


def create_rate_distribution_charts(ax1, ax2, scenarios, colors):
    """Create rate distribution visualizations"""
    successful = [s for s in scenarios if s.success and s.rate]
    levels = [s.experience_level for s in successful]
    rates = [s.rate for s in successful]
    
    if not rates:
        ax1.text(0.5, 0.5, 'No rate data available', ha='center', va='center')
        ax2.text(0.5, 0.5, 'No rate data available', ha='center', va='center')
        return
    
    # Scatter plot with trend
    x = np.arange(len(levels))
    ax1.scatter(x, rates, s=300, alpha=0.6, color=colors['primary'],
               edgecolors='black', linewidth=2)
    
    # Add trend line
    if len(rates) > 1:
        z = np.polyfit(x, rates, 1)
        p = np.poly1d(z)
        ax1.plot(x, p(x), "--", color=colors['accent'], alpha=0.8, linewidth=3,
                label=f'Trend: ${z[0]:.2f}/level')
    
    ax1.set_xticks(x)
    ax1.set_xticklabels(levels, rotation=45, ha='right')
    ax1.set_xlabel('Experience Level', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Hourly Rate ($)', fontsize=12, fontweight='bold')
    ax1.set_title('Rate Distribution with Trend', fontsize=13, fontweight='bold')
    ax1.legend(fontsize=10)
    ax1.grid(True, alpha=0.3)
    
    # Box plot
    ax2.boxplot([rates], labels=['All Levels'], widths=0.6,
                patch_artist=True,
                boxprops=dict(facecolor=colors['primary'], alpha=0.6, linewidth=2),
                medianprops=dict(color='red', linewidth=3),
                whiskerprops=dict(linewidth=2),
                capprops=dict(linewidth=2))
    
    # Add statistics
    mean_rate = np.mean(rates)
    median_rate = np.median(rates)
    min_rate = min(rates)
    max_rate = max(rates)
    
    stats_text = f"Min: ${min_rate:.2f}\n"
    stats_text += f"Max: ${max_rate:.2f}\n"
    stats_text += f"Mean: ${mean_rate:.2f}\n"
    stats_text += f"Median: ${median_rate:.2f}"
    
    ax2.text(1.25, mean_rate, stats_text, fontsize=10, fontweight='bold',
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    
    ax2.set_ylabel('Hourly Rate ($)', fontsize=12, fontweight='bold')
    ax2.set_title('Rate Statistics', fontsize=13, fontweight='bold')
    ax2.grid(True, alpha=0.3, axis='y')


def create_summary_dashboard(fig, scenarios, metadata, colors):
    """Create comprehensive summary dashboard"""
    gs = GridSpec(3, 2, figure=fig, hspace=0.4, wspace=0.3)
    
    successful = [s for s in scenarios if s.success]
    rates = [s.rate for s in successful if s.rate]
    
    # Top section: Key metrics
    ax_metrics = fig.add_subplot(gs[0, :])
    ax_metrics.axis('off')
    
    metrics_text = "KEY METRICS\n" + "="*60 + "\n\n"
    
    if rates:
        avg_rate = sum(rates) / len(rates)
        min_rate = min(rates)
        max_rate = max(rates)
        
        metrics_text += f"Average Hourly Rate: ${avg_rate:.2f}\n"
        metrics_text += f"Rate Range: ${min_rate:.2f} - ${max_rate:.2f}\n\n"
    
    total_scenarios = len(scenarios)
    success_count = len(successful)
    web_sources = sum(1 for s in successful if s.has_web_urls)
    
    metrics_text += f"Test Scenarios: {success_count}/{total_scenarios} successful\n"
    metrics_text += f"Web Sources: {web_sources}/{success_count} scenarios\n"
    
    if metadata.get('grounding_enabled') is not None:
        grounding_status = "ENABLED ✓" if metadata['grounding_enabled'] else "DISABLED ✗"
        metrics_text += f"\nGoogle Search Grounding: {grounding_status}"
    
    ax_metrics.text(0.05, 0.95, metrics_text, transform=ax_metrics.transAxes,
                   fontsize=11, verticalalignment='top', fontfamily='monospace',
                   bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.3))
    
    # Middle left: Rate comparison
    ax_rate = fig.add_subplot(gs[1, 0])
    levels = [s.experience_level for s in successful if s.rate]
    rates_plot = [s.rate for s in successful if s.rate]
    if rates_plot:
        ax_rate.barh(levels, rates_plot, color=colors['primary'], alpha=0.7, edgecolor='black')
        ax_rate.set_xlabel('Rate ($)', fontsize=10, fontweight='bold')
        ax_rate.set_title('Rates by Level', fontsize=11, fontweight='bold')
        ax_rate.grid(True, alpha=0.3, axis='x')
    
    # Middle right: Cost breakdown
    ax_cost = fig.add_subplot(gs[1, 1])
    if successful:
        avg_software = np.mean([s.software_cost or 0 for s in successful])
        avg_workspace = np.mean([s.workspace_cost or 0 for s in successful])
        avg_equipment = np.mean([s.equipment_cost or 0 for s in successful])
        
        costs = [avg_software, avg_workspace, avg_equipment]
        labels = ['Software', 'Workspace', 'Equipment']
        
        wedges, texts, autotexts = ax_cost.pie(costs, labels=labels, autopct='%1.1f%%',
                                                colors=[colors['primary'], colors['secondary'], colors['accent']],
                                                startangle=90)
        ax_cost.set_title('Avg Cost Distribution', fontsize=11, fontweight='bold')
    
    # Bottom: Sources details
    ax_sources = fig.add_subplot(gs[2, :])
    ax_sources.axis('off')
    
    sources_text = "SOURCE ANALYSIS\n" + "="*60 + "\n\n"
    
    for s in successful[:3]:  # Show first 3 scenarios
        sources_text += f"{s.experience_level.upper()}: {s.sources_count} sources"
        if s.has_web_urls:
            sources_text += " (includes web URLs 🌐)\n"
        else:
            sources_text += " (knowledge base only 📚)\n"
        
        # Show first 2 sources
        for src in s.sources[:2]:
            src_str = str(src)
            if len(src_str) > 70:
                src_str = src_str[:67] + "..."
            sources_text += f"  • {src_str}\n"
        sources_text += "\n"
    
    ax_sources.text(0.05, 0.95, sources_text, transform=ax_sources.transAxes,
                   fontsize=9, verticalalignment='top', fontfamily='monospace',
                   bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.2))


def create_combined_pdf(image_paths, output_path, scenarios, metadata):
    """Create combined PDF report"""
    from matplotlib.backends.backend_pdf import PdfPages
    
    with PdfPages(output_path) as pdf:
        # Cover page
        fig = plt.figure(figsize=(8.5, 11))
        fig.patch.set_facecolor('white')
        ax = fig.add_subplot(111)
        ax.axis('off')
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        
        # Title
        title_box = plt.Rectangle((0.08, 0.85), 0.84, 0.11,
                                  facecolor='#2E86AB', edgecolor='black',
                                  linewidth=2.5, transform=ax.transAxes)
        ax.add_patch(title_box)
        
        ax.text(0.5, 0.935, 'Quick Estimate API',
               transform=ax.transAxes, fontsize=26, fontweight='bold',
               ha='center', va='top', color='white')
        ax.text(0.5, 0.885, 'Single Result Report',
               transform=ax.transAxes, fontsize=26, fontweight='bold',
               ha='center', va='top', color='white')
        
        # Test type
        if metadata.get('grounding_enabled') is not None:
            test_type = "With Google Search Grounding" if metadata['grounding_enabled'] else "Without Grounding"
            ax.text(0.5, 0.81, test_type,
                   transform=ax.transAxes, fontsize=13, style='italic',
                   ha='center', va='top', color='#333333', fontweight='bold')
        
        ax.plot([0.1, 0.9], [0.79, 0.79], 'k-', linewidth=1.5, transform=ax.transAxes)
        
        # Statistics
        successful = [s for s in scenarios if s.success]
        rates = [s.rate for s in successful if s.rate]
        
        if rates:
            avg_rate = sum(rates) / len(rates)
            min_rate = min(rates)
            max_rate = max(rates)
            
            ax.text(0.5, 0.72, 'AVERAGE HOURLY RATE',
                   transform=ax.transAxes, fontsize=14, fontweight='bold',
                   ha='center', va='top', color='#2E86AB')
            
            rate_box = plt.Rectangle((0.25, 0.59), 0.5, 0.10,
                                    facecolor='#E8F4F8', edgecolor='#2E86AB',
                                    linewidth=2.5, transform=ax.transAxes)
            ax.add_patch(rate_box)
            
            ax.text(0.5, 0.66, f'${avg_rate:.2f}/hr',
                   transform=ax.transAxes, fontsize=28, fontweight='bold',
                   ha='center', va='top', color='#1a4d6b')
            
            ax.text(0.5, 0.61, f'Range: ${min_rate:.2f} - ${max_rate:.2f}',
                   transform=ax.transAxes, fontsize=12,
                   ha='center', va='top', color='#333333')
        
        # Test details
        info_y = 0.50
        ax.text(0.5, info_y, 'TEST DETAILS',
               transform=ax.transAxes, fontsize=13, fontweight='bold',
               ha='center', va='top', color='#2E86AB')
        
        info_box = plt.Rectangle((0.15, info_y - 0.14), 0.7, 0.12,
                                facecolor='#F5F5F5', edgecolor='#CCCCCC',
                                linewidth=1.5, transform=ax.transAxes)
        ax.add_patch(info_box)
        
        test_time = metadata.get('timestamp', datetime.now().isoformat())
        try:
            test_dt = datetime.fromisoformat(test_time.replace('Z', '+00:00'))
            test_time_str = test_dt.strftime('%B %d, %Y at %I:%M %p')
        except:
            test_time_str = test_time
        
        info_text = f"Generated: {test_time_str}\n\n"
        info_text += f"Scenarios: {len(successful)}/{len(scenarios)} successful\n"
        info_text += f"Charts: {len(image_paths)}\n"
        
        web_sources = sum(1 for s in successful if s.has_web_urls)
        info_text += f"Web Sources: {web_sources}/{len(successful)}"
        
        ax.text(0.5, info_y - 0.018, info_text,
               transform=ax.transAxes, fontsize=9,
               ha='center', va='top', color='#333333',
               linespacing=1.5)
        
        # Footer
        ax.text(0.5, 0.08, 'This report visualizes rate estimates and cost analysis\nfor freelance/contractor pricing',
               transform=ax.transAxes, fontsize=8, style='italic',
               ha='center', va='top', color='#666666', linespacing=1.4)
        
        ax.text(0.5, 0.02, 'Page 1',
               transform=ax.transAxes, fontsize=9,
               ha='center', va='bottom', color='#999999')
        
        pdf.savefig(fig, bbox_inches='tight')
        plt.close()
        
        # Add chart images
        for idx, img_path in enumerate(image_paths, start=2):
            img = plt.imread(str(img_path))
            fig = plt.figure(figsize=(8.5, 11))
            ax = fig.add_subplot(111)
            ax.imshow(img)
            ax.axis('off')
            fig.text(0.5, 0.02, f'Page {idx} of {len(image_paths) + 1}',
                    ha='center', va='bottom', fontsize=9, color='#999999')
            pdf.savefig(fig, bbox_inches='tight')
            plt.close()
        
        # Set metadata
        d = pdf.infodict()
        d['Title'] = 'Quick Estimate API Single Result Report'
        d['Author'] = 'Quick Estimate Visualizer'
        d['Subject'] = 'Rate Estimation Analysis'
        d['CreationDate'] = datetime.now()
    
    print(f"  {Colors.GREEN}✓ PDF report saved to: {output_path}{Colors.END}\n")


def print_text_report(scenarios: List[ScenarioResult], metadata: Dict):
    """Print text-based report to console"""
    print()
    print(f"{Colors.CYAN}╔══════════════════════════════════════════════════════════════════════════╗{Colors.END}")
    print(f"{Colors.CYAN}║              Quick Estimate API - Single Result Analysis                ║{Colors.END}")
    print(f"{Colors.CYAN}╚══════════════════════════════════════════════════════════════════════════╝{Colors.END}")
    print()
    
    # Test info
    test_time = metadata.get('timestamp', 'Unknown')
    print(f"  Test Time: {test_time}")
    
    if metadata.get('grounding_enabled') is not None:
        grounding = "ENABLED ✓" if metadata['grounding_enabled'] else "DISABLED ✗"
        color = Colors.GREEN if metadata['grounding_enabled'] else Colors.YELLOW
        print(f"  Google Search Grounding: {color}{grounding}{Colors.END}")
    
    print()
    
    # Results table
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}  RESULTS BY EXPERIENCE LEVEL{Colors.END}")
    print(f"{Colors.BOLD}{'='*80}{Colors.END}")
    print()
    
    print(f"  {'Level':<12} {'Rate':>12} {'Income':>12} {'Expenses':>12} {'Sources':>10} {'Web':>8}")
    print(f"  {'-'*12} {'-'*12} {'-'*12} {'-'*12} {'-'*10} {'-'*8}")
    
    for s in scenarios:
        if s.success:
            rate_str = f"${s.rate:.2f}/hr" if s.rate else "N/A"
            income_str = f"${s.suggested_income:.0f}" if s.suggested_income else "N/A"
            expense_str = f"${s.total_expenses:.0f}" if s.total_expenses else "N/A"
            sources_str = f"{s.sources_count}"
            web_str = f"{Colors.GREEN}YES{Colors.END}" if s.has_web_urls else f"{Colors.YELLOW}NO{Colors.END}"
            
            print(f"  {s.experience_level:<12} {rate_str:>12} {income_str:>12} {expense_str:>12} {sources_str:>10} {web_str:>8}")
        else:
            print(f"  {s.experience_level:<12} {Colors.RED}FAILED{Colors.END}")
    
    print()
    
    # Statistics
    successful = [s for s in scenarios if s.success]
    rates = [s.rate for s in successful if s.rate]
    
    if rates:
        print(f"{Colors.BOLD}{'='*80}{Colors.END}")
        print(f"{Colors.BOLD}  STATISTICS{Colors.END}")
        print(f"{Colors.BOLD}{'='*80}{Colors.END}")
        print()
        
        avg_rate = sum(rates) / len(rates)
        min_rate = min(rates)
        max_rate = max(rates)
        
        print(f"  Average Rate: ${avg_rate:.2f}/hr")
        print(f"  Range: ${min_rate:.2f} - ${max_rate:.2f}/hr")
        print(f"  Scenarios: {len(successful)}/{len(scenarios)} successful")
        
        web_count = sum(1 for s in successful if s.has_web_urls)
        print(f"  Web Sources: {web_count}/{len(successful)}")
        print()


def main():
    """Main entry point"""
    script_dir = Path(__file__).parent
    results_dir = script_dir / 'results'
    
    # Determine input file
    if len(sys.argv) >= 2:
        input_file = Path(sys.argv[1])
    else:
        # Use latest with grounding by default
        input_file = results_dir / 'latest_with_grounding.json'
        
        if not input_file.exists():
            print(f"{Colors.RED}Error: No result file found.{Colors.END}")
            print(f"Usage: python3 visualize_single.py <result_file.json>")
            print(f"Or run the test script first: ./quick-estimate-test.sh")
            sys.exit(1)
    
    print(f"Loading: {input_file}")
    data = load_json_file(str(input_file))
    
    # Parse results
    scenarios = parse_results(data)
    metadata = {
        'timestamp': data.get('timestamp'),
        'grounding_enabled': data.get('grounding_enabled'),
        'test_mode': data.get('test_mode')
    }
    
    # Print text report
    print_text_report(scenarios, metadata)
    
    # Generate visualizations
    print(f"{Colors.BOLD}Generating visualizations...{Colors.END}")
    results_dir.mkdir(exist_ok=True)
    visual_dir = create_visualizations(scenarios, metadata, results_dir)
    
    print()
    print(f"{Colors.CYAN}{'='*80}{Colors.END}")
    print(f"{Colors.GREEN}✓ Visualization complete!{Colors.END}")
    print(f"{Colors.CYAN}{'='*80}{Colors.END}")
    print()
    print(f"  📊 Charts directory: {visual_dir}/")
    print(f"  📄 Combined PDF: {visual_dir}/REPORT_*.pdf")
    print()


if __name__ == '__main__':
    main()
