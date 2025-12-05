#!/usr/bin/env python3
"""
Maintenance Operations Center - Command Line Interface

A comprehensive CLI for the maintenance coordination system with support for:
- Interactive mode for real-time coordination
- Batch operations for efficiency
- Voice processing for accessibility
- System monitoring and reporting
"""

import asyncio
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any

import typer
import rich
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.prompt import Prompt, Confirm
from rich.syntax import Syntax

from main import (
    MaintenanceCoordinator, 
    coordination_agent, 
    voice_agent,
    SMSAgent, 
    CalendarAgent, 
    PhotoAnalysisAgent, 
    RulesAgent,
    WorkOrder,
    TechnicianAvailability,
    VendorRequest
)

# Initialize Rich console for beautiful output
console = Console()
app = typer.Typer(
    name="maintenance-ops",
    help="🔧 Maintenance Operations Center - AI Coordination System",
    add_completion=False
)

# Global coordinator instance
coordinator: Optional[MaintenanceCoordinator] = None

# =============================================================================
# INITIALIZATION & SETUP
# =============================================================================

async def initialize_system() -> MaintenanceCoordinator:
    """Initialize the maintenance coordination system"""
    global coordinator
    
    if coordinator is not None:
        return coordinator
    
    console.print("🚀 Initializing Maintenance Operations Center...", style="bold blue")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        
        # Initialize foundation agents
        task1 = progress.add_task("Loading foundation agents...", total=None)
        sms_agent = SMSAgent(api_key="mock_key")  # Load from env
        calendar_agent = CalendarAgent({"service": "google_calendar"})
        photo_agent = PhotoAnalysisAgent()
        rules_agent = RulesAgent()
        progress.update(task1, completed=True)
        
        # Initialize coordinator
        task2 = progress.add_task("Setting up coordination system...", total=None)
        coordinator = MaintenanceCoordinator(
            sms_agent=sms_agent,
            calendar_agent=calendar_agent,
            photo_agent=photo_agent,
            rules_agent=rules_agent
        )
        progress.update(task2, completed=True)
        
        # Load sample data
        task3 = progress.add_task("Loading technician data...", total=None)
        await load_sample_technicians(coordinator)
        progress.update(task3, completed=True)
    
    console.print("✅ System initialized successfully!", style="bold green")
    return coordinator

async def load_sample_technicians(coord: MaintenanceCoordinator):
    """Load sample technician data"""
    technicians_data = [
        {
            "technician_id": "TECH001",
            "name": "Ramon", 
            "skills": ["plumbing", "general_maintenance", "appliance_repair"],
            "current_workload": 2,
            "max_daily_workload": 6,
            "current_location": "Building A"
        },
        {
            "technician_id": "TECH002",
            "name": "Kishan",
            "skills": ["electrical", "hvac", "general_maintenance"],
            "current_workload": 3,
            "max_daily_workload": 6,
            "current_location": "Building B"
        },
        {
            "technician_id": "TECH003",
            "name": "Carlos",
            "skills": ["painting", "drywall", "general_maintenance"],
            "current_workload": 1,
            "max_daily_workload": 6,
            "current_location": "Building C"
        }
    ]
    
    for tech_data in technicians_data:
        coord.technicians[tech_data["technician_id"]] = TechnicianAvailability(**tech_data)

# =============================================================================
# WORK ORDER MANAGEMENT COMMANDS
# =============================================================================

@app.command("create")
async def create_work_order(
    description: str = typer.Argument(..., help="Work order description"),
    building: str = typer.Option(..., "--building", "-b", help="Building identifier"),
    unit: Optional[str] = typer.Option(None, "--unit", "-u", help="Unit number"),
    tenant: Optional[str] = typer.Option(None, "--tenant", "-t", help="Tenant contact"),
    priority: Optional[str] = typer.Option(None, "--priority", "-p", help="Override priority classification"),
    voice: bool = typer.Option(False, "--voice", help="Process as voice input")
):
    """Create a new work order"""
    coord = await initialize_system()
    
    console.print(f"📝 Creating work order: {description}", style="bold")
    
    try:
        if voice:
            # Process as voice input first
            voice_result = await voice_agent.run(
                f"Process voice input: {description}",
                deps=coord
            )
            console.print(f"🎤 Voice processing: {voice_result.data}")
        
        # Create work order through coordination agent
        result = await coordination_agent.run(
            f"Create work order for '{description}' in building {building}" +
            (f" unit {unit}" if unit else "") +
            (f" tenant contact {tenant}" if tenant else ""),
            deps=coord
        )
        
        console.print(f"✅ {result.data}", style="green")
        
        # Show work order details
        if coord.work_orders:
            latest_wo = list(coord.work_orders.values())[-1]
            show_work_order_details(latest_wo)
            
    except Exception as e:
        console.print(f"❌ Error creating work order: {e}", style="red")

@app.command("assign")
async def assign_technician_to_work_order(
    work_order_id: str = typer.Argument(..., help="Work order ID"),
    technician_id: str = typer.Argument(..., help="Technician ID"),
    override: bool = typer.Option(False, "--override", help="Override workload limits")
):
    """Assign technician to work order (coordinator only)"""
    coord = await initialize_system()
    
    console.print(f"👷 Assigning technician {technician_id} to work order {work_order_id}")
    
    try:
        result = await coordination_agent.run(
            f"Assign technician {technician_id} to work order {work_order_id}" +
            (" with coordinator override" if override else ""),
            deps=coord
        )
        
        console.print(f"✅ {result.data}", style="green")
        
    except Exception as e:
        console.print(f"❌ Error assigning technician: {e}", style="red")

@app.command("status")
async def update_work_order_status(
    work_order_id: str = typer.Argument(..., help="Work order ID"),
    new_status: str = typer.Argument(..., help="New status"),
    role: str = typer.Option("coordinator", "--role", "-r", help="User role (coordinator/technician)"),
    photos: bool = typer.Option(False, "--photos", help="Include sample photos")
):
    """Update work order status with role-based restrictions"""
    coord = await initialize_system()
    
    console.print(f"🔄 Updating work order {work_order_id} to status: {new_status}")
    
    try:
        # Simulate photos if requested
        photo_data = []
        if photos:
            photo_data = [
                {"filename": "before.jpg", "metadata": {"building": "Building A", "timestamp": datetime.now().isoformat()}},
                {"filename": "after.jpg", "metadata": {"building": "Building A", "timestamp": datetime.now().isoformat()}}
            ]
        
        result = await coordination_agent.run(
            f"Update work order {work_order_id} status to {new_status} as {role}" +
            (" with photos" if photos else ""),
            deps=coord
        )
        
        console.print(f"✅ {result.data}", style="green")
        
    except Exception as e:
        console.print(f"❌ Error updating status: {e}", style="red")

# =============================================================================
# COORDINATION DASHBOARD COMMANDS
# =============================================================================

@app.command("dashboard")
async def show_coordinator_dashboard():
    """Show the coordinator dashboard with approval queue and technician status"""
    coord = await initialize_system()
    
    console.print("📊 Coordinator Dashboard", style="bold blue")
    console.print("=" * 60)
    
    # Show approval queue
    console.print("\n🔍 Approval Queue", style="bold yellow")
    try:
        approval_result = await coordination_agent.run(
            "Get coordinator approval queue",
            deps=coord
        )
        
        if approval_result.data:
            approval_table = Table(title="Work Orders Awaiting Approval")
            approval_table.add_column("Work Order ID", style="cyan")
            approval_table.add_column("Title", style="white")
            approval_table.add_column("Building", style="green")
            approval_table.add_column("Technician", style="yellow")
            approval_table.add_column("Priority", style="red")
            approval_table.add_column("Photos", style="blue")
            
            for item in approval_result.data:
                approval_table.add_row(
                    item["work_order_id"],
                    item["title"][:30] + "..." if len(item["title"]) > 30 else item["title"],
                    f"{item['building']} · {item['unit']}" if item.get("unit") else item["building"],
                    item["assigned_technician"] or "Unassigned",
                    item["priority"],
                    str(item["photos_count"])
                )
            
            console.print(approval_table)
        else:
            console.print("✨ No work orders pending approval", style="green")
            
    except Exception as e:
        console.print(f"❌ Error fetching approval queue: {e}", style="red")
    
    # Show technician status
    console.print("\n👷 Technician Status", style="bold yellow")
    try:
        visibility_result = await coordination_agent.run(
            "Get technician visibility dashboard",
            deps=coord
        )
        
        if visibility_result.data:
            tech_table = Table(title="Current Technician Activities")
            tech_table.add_column("Technician", style="cyan")
            tech_table.add_column("Workload", style="yellow")
            tech_table.add_column("Location", style="green")
            tech_table.add_column("Active Orders", style="white")
            tech_table.add_column("Emergency Override", style="red")
            
            for tech_id, tech_data in visibility_result.data.items():
                workload_display = f"{tech_data['current_workload']}/{tech_data['max_workload']}"
                if tech_data['current_workload'] >= tech_data['max_workload']:
                    workload_style = "red"
                elif tech_data['current_workload'] >= tech_data['max_workload'] * 0.8:
                    workload_style = "yellow"
                else:
                    workload_style = "green"
                
                active_orders = len(tech_data['active_work_orders'])
                override_status = "🚨 YES" if tech_data['emergency_override'] else "No"
                
                tech_table.add_row(
                    tech_data['name'],
                    f"[{workload_style}]{workload_display}[/{workload_style}]",
                    tech_data['current_location'] or "Unknown",
                    str(active_orders),
                    override_status
                )
            
            console.print(tech_table)
        else:
            console.print("⚠️ No technician data available", style="yellow")
            
    except Exception as e:
        console.print(f"❌ Error fetching technician status: {e}", style="red")

@app.command("approve")
async def approve_work_order(
    work_order_id: str = typer.Argument(..., help="Work order ID to approve"),
    notes: Optional[str] = typer.Option(None, "--notes", "-n", help="Approval notes")
):
    """Approve completed work order (coordinator only)"""
    coord = await initialize_system()
    
    console.print(f"✅ Approving work order {work_order_id}")
    
    try:
        # Show work order details first
        if work_order_id in coord.work_orders:
            wo = coord.work_orders[work_order_id]
            show_work_order_details(wo)
            
            # Confirm approval
            if Confirm.ask(f"Approve work order {work_order_id}?"):
                result = await coordination_agent.run(
                    f"Update work order {work_order_id} status to completed as coordinator" +
                    (f" with notes: {notes}" if notes else ""),
                    deps=coord
                )
                console.print(f"✅ {result.data}", style="green")
            else:
                console.print("❌ Approval cancelled", style="yellow")
        else:
            console.print(f"❌ Work order {work_order_id} not found", style="red")
            
    except Exception as e:
        console.print(f"❌ Error approving work order: {e}", style="red")

# =============================================================================
# VOICE PROCESSING COMMANDS
# =============================================================================

@app.command("voice")
async def process_voice_input(
    transcript: str = typer.Argument(..., help="Voice transcript or file path"),
    source: str = typer.Option("phone", "--source", "-s", help="Voice source (phone/telegram)"),
    create_order: bool = typer.Option(True, "--create", help="Automatically create work order if confident")
):
    """Process voice input for work order creation"""
    coord = await initialize_system()
    
    console.print(f"🎤 Processing voice input from {source}")
    
    try:
        # Check if transcript is a file path
        if Path(transcript).exists():
            with open(transcript, 'r') as f:
                transcript = f.read()
            console.print(f"📁 Loaded transcript from file")
        
        # Process voice input
        voice_result = await voice_agent.run(
            f"Process voice input: {transcript}",
            deps=coord
        )
        
        console.print("🎤 Voice Processing Results:", style="bold")
        voice_data = voice_result.data
        
        # Display extracted information
        info_table = Table(title="Extracted Information")
        info_table.add_column("Field", style="cyan")
        info_table.add_column("Value", style="white")
        info_table.add_column("Confidence", style="yellow")
        
        info_table.add_row("Description", voice_data.get("description", "N/A"), "")
        info_table.add_row("Building", voice_data.get("building", "Not specified"), "")
        info_table.add_row("Unit", voice_data.get("unit", "Not specified"), "")
        info_table.add_row("Contact", voice_data.get("tenant_contact", "Not specified"), "")
        info_table.add_row("Priority Indicators", ", ".join(voice_data.get("priority_indicators", [])) or "None", "")
        info_table.add_row("Overall Confidence", "", f"{voice_data.get('confidence', 0):.1%}")
        
        console.print(info_table)
        
        # Auto-create work order if confidence is high
        if create_order and voice_data.get("confidence", 0) > 0.8:
            if voice_data.get("building") and voice_data.get("description"):
                console.print("🚀 Auto-creating work order (high confidence)...")
                
                result = await coordination_agent.run(
                    f"Create work order for '{voice_data['description']}' in building {voice_data['building']}" +
                    (f" unit {voice_data['unit']}" if voice_data.get('unit') else ""),
                    deps=coord
                )
                console.print(f"✅ {result.data}", style="green")
            else:
                console.print("⚠️ Missing required information for auto-creation", style="yellow")
        elif create_order:
            console.print("⚠️ Confidence too low for auto-creation. Manual review required.", style="yellow")
            
    except Exception as e:
        console.print(f"❌ Error processing voice input: {e}", style="red")

@app.command("batch-voice")
async def process_voice_batch(
    directory: str = typer.Argument(..., help="Directory containing voice files"),
    file_pattern: str = typer.Option("*.wav", "--pattern", "-p", help="File pattern to match"),
    auto_create: bool = typer.Option(False, "--auto-create", help="Auto-create high-confidence work orders")
):
    """Process multiple voice files in batch"""
    coord = await initialize_system()
    
    voice_dir = Path(directory)
    if not voice_dir.exists():
        console.print(f"❌ Directory {directory} does not exist", style="red")
        return
    
    voice_files = list(voice_dir.glob(file_pattern))
    if not voice_files:
        console.print(f"❌ No files matching pattern {file_pattern} found", style="red")
        return
    
    console.print(f"🎤 Processing {len(voice_files)} voice files...")
    
    processed_count = 0
    created_count = 0
    
    with Progress(console=console) as progress:
        task = progress.add_task("Processing voice files...", total=len(voice_files))
        
        for voice_file in voice_files:
            try:
                # Mock voice-to-text conversion (would use actual service)
                transcript = f"Mock transcript for {voice_file.name}"
                
                voice_result = await voice_agent.run(
                    f"Process voice input: {transcript}",
                    deps=coord
                )
                
                processed_count += 1
                
                # Auto-create if requested and confident
                if auto_create and voice_result.data.get("confidence", 0) > 0.8:
                    voice_data = voice_result.data
                    if voice_data.get("building") and voice_data.get("description"):
                        await coordination_agent.run(
                            f"Create work order for '{voice_data['description']}' in building {voice_data['building']}",
                            deps=coord
                        )
                        created_count += 1
                
                progress.update(task, advance=1)
                
            except Exception as e:
                console.print(f"⚠️ Error processing {voice_file.name}: {e}", style="yellow")
                progress.update(task, advance=1)
    
    console.print(f"✅ Processed {processed_count} files, created {created_count} work orders", style="green")

# =============================================================================
# VENDOR MANAGEMENT COMMANDS
# =============================================================================

@app.command("request-vendor")
async def create_vendor_request(
    work_order_id: str = typer.Argument(..., help="Work order ID"),
    category: str = typer.Option(..., "--category", "-c", help="Vendor category"),
    skills: str = typer.Option(..., "--skills", "-s", help="Required skills (comma-separated)"),
    budget: Optional[float] = typer.Option(None, "--budget", "-b", help="Maximum budget")
):
    """Create vendor request for specialized work"""
    coord = await initialize_system()
    
    skills_list = [skill.strip() for skill in skills.split(",")]
    
    console.print(f"🏢 Creating vendor request for work order {work_order_id}")
    console.print(f"Category: {category}, Skills: {skills_list}")
    
    try:
        result = await coordination_agent.run(
            f"Create vendor request for work order {work_order_id}, category {category}, " +
            f"specialties {skills_list}" + (f", max budget ${budget}" if budget else ""),
            deps=coord
        )
        
        console.print(f"✅ {result.data}", style="green")
        
    except Exception as e:
        console.print(f"❌ Error creating vendor request: {e}", style="red")

@app.command("vendor-responses")
async def show_vendor_responses(
    request_id: Optional[str] = typer.Argument(None, help="Vendor request ID"),
):
    """Show vendor responses for requests"""
    coord = await initialize_system()
    
    if request_id:
        if request_id in coord.vendor_requests:
            vendor_request = coord.vendor_requests[request_id]
            show_vendor_request_details(vendor_request)
        else:
            console.print(f"❌ Vendor request {request_id} not found", style="red")
    else:
        # Show all vendor requests
        if coord.vendor_requests:
            vendor_table = Table(title="All Vendor Requests")
            vendor_table.add_column("Request ID", style="cyan")
            vendor_table.add_column("Work Order", style="white")
            vendor_table.add_column("Category", style="yellow")
            vendor_table.add_column("Specialties", style="green")
            vendor_table.add_column("Responses", style="blue")
            vendor_table.add_column("Status", style="red")
            
            for req_id, vendor_req in coord.vendor_requests.items():
                status = "Selected" if vendor_req.selected_vendor else "Pending"
                vendor_table.add_row(
                    req_id,
                    vendor_req.work_order_id,
                    vendor_req.vendor_category,
                    ", ".join(vendor_req.specialties_required),
                    str(len(vendor_req.vendor_responses)),
                    status
                )
            
            console.print(vendor_table)
        else:
            console.print("📋 No vendor requests found", style="yellow")

# =============================================================================
# REPORTING AND ANALYTICS COMMANDS
# =============================================================================

@app.command("report")
async def generate_daily_report(
    date: Optional[str] = typer.Option(None, "--date", "-d", help="Date (YYYY-MM-DD)"),
    export_file: Optional[str] = typer.Option(None, "--export", "-e", help="Export to file")
):
    """Generate daily performance report"""
    coord = await initialize_system()
    
    report_date = datetime.fromisoformat(date) if date else datetime.now()
    
    console.print(f"📊 Daily Performance Report - {report_date.strftime('%Y-%m-%d')}", style="bold blue")
    console.print("=" * 60)
    
    # Calculate metrics
    total_work_orders = len(coord.work_orders)
    completed_orders = len([wo for wo in coord.work_orders.values() if wo.status.current == "completed"])
    pending_approval = len([wo for wo in coord.work_orders.values() if wo.status.current == "ready_review"])
    in_progress = len([wo for wo in coord.work_orders.values() if wo.status.current == "in_progress"])
    
    # Create metrics table
    metrics_table = Table(title="Daily Metrics")
    metrics_table.add_column("Metric", style="cyan")
    metrics_table.add_column("Value", style="white")
    metrics_table.add_column("Target", style="green")
    metrics_table.add_column("Status", style="yellow")
    
    metrics_data = [
        ("Total Work Orders", str(total_work_orders), "-", "📊"),
        ("Completed Today", str(completed_orders), "85%", "✅" if completed_orders >= total_work_orders * 0.85 else "⚠️"),
        ("Pending Approval", str(pending_approval), "< 10%", "✅" if pending_approval < total_work_orders * 0.1 else "⚠️"),
        ("In Progress", str(in_progress), "-", "🔄"),
    ]
    
    for metric, value, target, status in metrics_data:
        metrics_table.add_row(metric, value, target, status)
    
    console.print(metrics_table)
    
    # Technician performance
    console.print("\n👷 Technician Performance", style="bold")
    tech_perf_table = Table()
    tech_perf_table.add_column("Technician", style="cyan")
    tech_perf_table.add_column("Completed", style="green")
    tech_perf_table.add_column("In Progress", style="yellow")
    tech_perf_table.add_column("Efficiency", style="blue")
    
    for tech_id, tech in coord.technicians.items():
        completed = len([wo for wo in coord.work_orders.values() 
                        if wo.assigned_technician == tech_id and wo.status.current == "completed"])
        active = len([wo for wo in coord.work_orders.values() 
                     if wo.assigned_technician == tech_id and wo.status.current == "in_progress"])
        efficiency = f"{(completed / max(completed + active, 1)) * 100:.1f}%"
        
        tech_perf_table.add_row(tech.name, str(completed), str(active), efficiency)
    
    console.print(tech_perf_table)
    
    # Export if requested
    if export_file:
        report_data = {
            "date": report_date.isoformat(),
            "metrics": {
                "total_work_orders": total_work_orders,
                "completed_orders": completed_orders,
                "pending_approval": pending_approval,
                "in_progress": in_progress
            },
            "technician_performance": {
                tech_id: {
                    "name": tech.name,
                    "completed": len([wo for wo in coord.work_orders.values() 
                                   if wo.assigned_technician == tech_id and wo.status.current == "completed"]),
                    "in_progress": len([wo for wo in coord.work_orders.values() 
                                      if wo.assigned_technician == tech_id and wo.status.current == "in_progress"])
                }
                for tech_id, tech in coord.technicians.items()
            }
        }
        
        with open(export_file, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        console.print(f"📁 Report exported to {export_file}", style="green")

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def show_work_order_details(work_order: WorkOrder):
    """Display detailed work order information"""
    panel_content = f"""
[bold]Work Order ID:[/bold] {work_order.id}
[bold]Title:[/bold] {work_order.title}
[bold]Description:[/bold] {work_order.description}
[bold]Location:[/bold] {work_order.building}{' · ' + work_order.unit if work_order.unit else ''}
[bold]Priority:[/bold] {work_order.priority.level} ({work_order.priority.response_time_hours}h response)
[bold]Status:[/bold] {work_order.status.current}
[bold]Assigned To:[/bold] {work_order.assigned_technician or 'Unassigned'}
[bold]Estimated Duration:[/bold] {work_order.estimated_duration_hours} hours
[bold]Created:[/bold] {work_order.created_at.strftime('%Y-%m-%d %H:%M')}
[bold]Photos:[/bold] {len(work_order.photos)} uploaded
[bold]Communications:[/bold] {len(work_order.communication_log)} entries
    """
    
    console.print(Panel(panel_content, title="Work Order Details", border_style="blue"))

def show_vendor_request_details(vendor_request: VendorRequest):
    """Display detailed vendor request information"""
    panel_content = f"""
[bold]Request ID:[/bold] {vendor_request.request_id}
[bold]Work Order:[/bold] {vendor_request.work_order_id}
[bold]Category:[/bold] {vendor_request.vendor_category}
[bold]Required Specialties:[/bold] {', '.join(vendor_request.specialties_required)}
[bold]Max Budget:[/bold] ${vendor_request.max_budget or 'Not specified'}
[bold]Response Deadline:[/bold] {vendor_request.response_deadline.strftime('%Y-%m-%d %H:%M')}
[bold]Responses Received:[/bold] {len(vendor_request.vendor_responses)}
[bold]Selected Vendor:[/bold] {vendor_request.selected_vendor or 'None'}
[bold]Coordinator Approved:[/bold] {'Yes' if vendor_request.coordinator_approved else 'No'}
    """
    
    console.print(Panel(panel_content, title="Vendor Request Details", border_style="green"))

# =============================================================================
# INTERACTIVE MODE
# =============================================================================

@app.command("interactive")
async def interactive_mode():
    """Start interactive coordination mode"""
    coord = await initialize_system()
    
    console.print("🎮 Interactive Maintenance Coordination Mode", style="bold blue")
    console.print("Type 'help' for commands, 'exit' to quit")
    console.print("=" * 60)
    
    while True:
        try:
            command = Prompt.ask("\n[bold cyan]maintenance-ops>[/bold cyan]").strip()
            
            if command.lower() in ['exit', 'quit', 'q']:
                console.print("👋 Goodbye!", style="bold green")
                break
            elif command.lower() in ['help', 'h']:
                show_interactive_help()
            elif command.lower() == 'dashboard':
                await show_coordinator_dashboard()
            elif command.lower() == 'status':
                await show_technician_status()
            elif command.startswith('create '):
                description = command[7:]  # Remove 'create '
                building = Prompt.ask("Building")
                unit = Prompt.ask("Unit (optional)") or None
                await create_work_order_interactive(coord, description, building, unit)
            elif command.startswith('assign '):
                parts = command.split()
                if len(parts) >= 3:
                    wo_id, tech_id = parts[1], parts[2]
                    await assign_technician_interactive(coord, wo_id, tech_id)
                else:
                    console.print("Usage: assign <work_order_id> <technician_id>", style="yellow")
            elif command.startswith('approve '):
                wo_id = command.split()[1] if len(command.split()) > 1 else ""
                await approve_work_order_interactive(coord, wo_id)
            elif command.lower() == 'list':
                show_work_order_list(coord)
            else:
                console.print(f"Unknown command: {command}. Type 'help' for available commands.", style="yellow")
                
        except KeyboardInterrupt:
            console.print("\n👋 Goodbye!", style="bold green")
            break
        except Exception as e:
            console.print(f"❌ Error: {e}", style="red")

def show_interactive_help():
    """Show interactive mode help"""
    help_text = """
[bold]Available Commands:[/bold]
  [cyan]dashboard[/cyan]              - Show coordinator dashboard
  [cyan]status[/cyan]                 - Show technician status
  [cyan]list[/cyan]                   - List all work orders
  [cyan]create <description>[/cyan]   - Create new work order
  [cyan]assign <wo_id> <tech_id>[/cyan] - Assign technician to work order
  [cyan]approve <wo_id>[/cyan]        - Approve completed work order
  [cyan]help[/cyan]                   - Show this help
  [cyan]exit[/cyan]                   - Exit interactive mode
    """
    console.print(Panel(help_text, title="Interactive Mode Help", border_style="green"))

async def create_work_order_interactive(coord: MaintenanceCoordinator, description: str, building: str, unit: Optional[str]):
    """Create work order in interactive mode"""
    try:
        result = await coordination_agent.run(
            f"Create work order for '{description}' in building {building}" +
            (f" unit {unit}" if unit else ""),
            deps=coord
        )
        console.print(f"✅ {result.data}", style="green")
    except Exception as e:
        console.print(f"❌ Error: {e}", style="red")

async def assign_technician_interactive(coord: MaintenanceCoordinator, wo_id: str, tech_id: str):
    """Assign technician in interactive mode"""
    try:
        result = await coordination_agent.run(
            f"Assign technician {tech_id} to work order {wo_id}",
            deps=coord
        )
        console.print(f"✅ {result.data}", style="green")
    except Exception as e:
        console.print(f"❌ Error: {e}", style="red")

async def approve_work_order_interactive(coord: MaintenanceCoordinator, wo_id: str):
    """Approve work order in interactive mode"""
    try:
        if wo_id in coord.work_orders:
            show_work_order_details(coord.work_orders[wo_id])
            if Confirm.ask(f"Approve work order {wo_id}?"):
                result = await coordination_agent.run(
                    f"Update work order {wo_id} status to completed as coordinator",
                    deps=coord
                )
                console.print(f"✅ {result.data}", style="green")
        else:
            console.print(f"❌ Work order {wo_id} not found", style="red")
    except Exception as e:
        console.print(f"❌ Error: {e}", style="red")

def show_work_order_list(coord: MaintenanceCoordinator):
    """Show list of all work orders"""
    if coord.work_orders:
        table = Table(title="All Work Orders")
        table.add_column("ID", style="cyan")
        table.add_column("Title", style="white")
        table.add_column("Location", style="green")
        table.add_column("Status", style="yellow")
        table.add_column("Technician", style="blue")
        table.add_column("Priority", style="red")
        
        for wo in coord.work_orders.values():
            table.add_row(
                wo.id,
                wo.title[:30] + "..." if len(wo.title) > 30 else wo.title,
                f"{wo.building}{' · ' + wo.unit if wo.unit else ''}",
                wo.status.current,
                wo.assigned_technician or "Unassigned",
                wo.priority.level
            )
        
        console.print(table)
    else:
        console.print("📋 No work orders found", style="yellow")

async def show_technician_status():
    """Show current technician status"""
    coord = await initialize_system()
    
    if coord.technicians:
        table = Table(title="Technician Status")
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="white")
        table.add_column("Skills", style="green")
        table.add_column("Workload", style="yellow")
        table.add_column("Location", style="blue")
        
        for tech in coord.technicians.values():
            workload = f"{tech.current_workload}/{tech.max_daily_workload}"
            skills = ", ".join(tech.skills[:3])  # Show first 3 skills
            if len(tech.skills) > 3:
                skills += f" (+{len(tech.skills) - 3})"
            
            table.add_row(
                tech.technician_id,
                tech.name,
                skills,
                workload,
                tech.current_location or "Unknown"
            )
        
        console.print(table)
    else:
        console.print("👷 No technicians found", style="yellow")

# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    # Handle async commands
    import inspect
    
    # Patch typer to handle async commands
    for name, obj in list(globals().items()):
        if hasattr(obj, "__annotations__") and inspect.iscoroutinefunction(obj):
            def make_sync(async_func):
                def sync_wrapper(*args, **kwargs):
                    return asyncio.run(async_func(*args, **kwargs))
                return sync_wrapper
            
            if hasattr(obj, "__name__"):
                globals()[obj.__name__] = make_sync(obj)
    
    app()
