from django.db import models
from django.conf import settings


class Team(models.Model):
    name = models.CharField(max_length=255)
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="managed_teams"
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="sales_teams",
        blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_teams"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Lead(models.Model):
    class StatusChoices(models.TextChoices):
        NEW = "New", "New"
        FOLLOW_UP = "Follow-up", "Follow-up"
        QUALIFIED = "Qualified", "Qualified"
        MEETING = "Meeting", "Meeting"
        REQUIREMENTS = "Requirements", "Requirements"
        PROPOSAL = "Proposal", "Proposal"
        NEGOTIATION = "Negotiation", "Negotiation"
        WON = "Won", "Won"
        LOST = "Lost", "Lost"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="leads"
    )
    name = models.CharField(max_length=255)
    company = models.CharField(max_length=255, null=True, blank=True) # Added company as per frontend
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    designation = models.CharField(max_length=255, null=True, blank=True)
    industry = models.CharField(max_length=100, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    linkedin_url = models.URLField(max_length=500, null=True, blank=True)
    custom_fields = models.JSONField(default=dict, blank=True)
    source = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(
        max_length=500, default="Yet to approach", null=True, blank=True
    )
    value = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    converted = models.BooleanField(default=False)
    score = models.IntegerField(default=0)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_leads"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    imported_at = models.DateTimeField(null=True, blank=True)
    imported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="imported_leads"
    )
    
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email"], name="idx_lead_email"),
            models.Index(fields=["owner", "status"], name="idx_lead_owner_status"),
        ]

    def save(self, *args, **kwargs):
        # Auto lead scoring logic (0-100)
        score_val = 10
        if self.email: score_val += 15
        if self.phone: score_val += 15
        if self.company: score_val += 10
        if self.industry: score_val += 10
        if self.designation: score_val += 10
        if self.linkedin_url: score_val += 15
        if self.status == "Won": score_val = 100
        elif self.status == "Lost": score_val = 0
        elif self.status in ["Proposal", "Negotiation"]: score_val += 15
        self.score = min(score_val, 100)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Contact(models.Model):
    lead = models.ForeignKey(
        Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name="contacts"
    )
    owner = models.ForeignKey( # Added owner for contact management
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="contacts"
    )
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    company = models.CharField(max_length=255, null=True, blank=True)
    industry = models.CharField(max_length=100, null=True, blank=True) # Added as per frontend
    size = models.CharField(max_length=50, null=True, blank=True, help_text="e.g., Enterprise, Mid-Market") # Added as per frontend
    website = models.CharField(max_length=255, null=True, blank=True) # Added as per frontend
    designation = models.CharField(max_length=255, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    linkedin_url = models.URLField(max_length=500, null=True, blank=True)
    custom_fields = models.JSONField(default=dict, blank=True)
    last_contacted = models.DateTimeField(null=True, blank=True) # Added as per frontend
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["email"], name="idx_contact_email"),
        ]

    def __str__(self):
        return self.name


class Deal(models.Model):
    class StageChoices(models.TextChoices):
        PROSPECTING = "PROSPECTING", "Prospecting"
        PROPOSAL = "PROPOSAL", "Proposal"
        NEGOTIATION = "NEGOTIATION", "Negotiation"
        CLOSED_WON = "CLOSED_WON", "Closed Won"
        CLOSED_LOST = "CLOSED_LOST", "Closed Lost"

    lead = models.ForeignKey(
        Lead, on_delete=models.SET_NULL, null=True, related_name="deals"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="deals"
    )
    name = models.CharField(max_length=255)
    stage = models.CharField(
        max_length=20, choices=StageChoices.choices, default=StageChoices.PROSPECTING
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    probability = models.IntegerField(default=10) # 0 to 100
    close_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.amount}"


class Activity(models.Model):
    class TypeChoices(models.TextChoices):
        NOTE = "NOTE", "Note"
        CALL = "CALL", "Call"
        EMAIL = "EMAIL", "Email"
        MEETING = "MEETING", "Meeting"

    type = models.CharField(max_length=20, choices=TypeChoices.choices, default=TypeChoices.NOTE)
    content = models.TextField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activities"
    )
    lead = models.ForeignKey(
        Lead, on_delete=models.CASCADE, null=True, blank=True, related_name="activities"
    )
    deal = models.ForeignKey(
        Deal, on_delete=models.CASCADE, null=True, blank=True, related_name="activities"
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_display()} by {self.user.email}"


class Task(models.Model):
    class PriorityChoices(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"

    class StatusChoices(models.TextChoices):
        TODO = "todo", "To Do"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField()
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    is_completed = models.BooleanField(default=False)
    priority = models.CharField(
        max_length=10, choices=PriorityChoices.choices, default=PriorityChoices.MEDIUM
    )
    status = models.CharField(
        max_length=20, choices=StatusChoices.choices, default=StatusChoices.TODO
    )
    progress_percentage = models.PositiveIntegerField(default=0)
    
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tasks"
    )
    lead = models.ForeignKey(
        Lead, on_delete=models.CASCADE, null=True, blank=True, related_name="tasks"
    )
    deal = models.ForeignKey(
        Deal, on_delete=models.CASCADE, null=True, blank=True, related_name="tasks"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-sync status and is_completed for backward compatibility
        if self.status == self.StatusChoices.COMPLETED:
            self.is_completed = True
            self.progress_percentage = 100
        elif self.is_completed:
            self.status = self.StatusChoices.COMPLETED
            self.progress_percentage = 100
        elif self.progress_percentage == 100:
            self.status = self.StatusChoices.COMPLETED
            self.is_completed = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.assigned_to.email}"


class ImportJob(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="imports"
    )
    filename = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING
    )
    summary = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Import {self.filename} ({self.status})"


class AdminPanelSetting(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="admin_panel")
    global_revenue_target = models.DecimalField(max_digits=15, decimal_places=2, default=1000000.0)
    enable_notifications = models.BooleanField(default=True)
    theme_preference = models.CharField(max_length=20, default="light")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Admin Panel - {self.user.email}"


class ManagerPanelSetting(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="manager_panel")
    team_revenue_target = models.DecimalField(max_digits=12, decimal_places=2, default=100000.0)
    report_frequency = models.CharField(max_length=20, default="weekly")
    theme_preference = models.CharField(max_length=20, default="light")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Manager Panel - {self.user.email}"


class SalesPanelSetting(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sales_panel")
    monthly_quota = models.DecimalField(max_digits=10, decimal_places=2, default=10000.0)
    theme_preference = models.CharField(max_length=20, default="light")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Sales Panel - {self.user.email}"


class Document(models.Model):
    lead = models.ForeignKey(
        Lead, on_delete=models.CASCADE, related_name="documents"
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="uploaded_documents"
    )
    file = models.FileField(upload_to="documents/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Doc for Lead {self.lead.id} - {self.file.name}"


class ActivityLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="activity_logs"
    )
    action = models.CharField(max_length=255)
    module = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        user_email = self.user.email if self.user else "System"
        return f"[{self.timestamp}] {user_email} - {self.action} on {self.module}"


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification for {self.user.email} - Read: {self.read}"


class EveningReport(models.Model):
    class StatusChoices(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        LATE_SUBMISSION = "late_submission", "Late Submission"

    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="evening_reports"
    )
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="team_evening_reports"
    )
    report_date = models.DateField()
    calls_done = models.PositiveIntegerField(default=0)
    emails_sent = models.PositiveIntegerField(default=0)
    followups_done = models.PositiveIntegerField(default=0)
    meetings_fixed = models.PositiveIntegerField(default=0)
    meetings_fixed_details = models.TextField(blank=True, default="")
    meetings_attended = models.PositiveIntegerField(default=0)
    meetings_attended_details = models.TextField(blank=True, default="")
    leads_generated = models.PositiveIntegerField(default=0)
    linkedin_outreach = models.PositiveIntegerField(default=0)
    demos_given = models.PositiveIntegerField(default=0)
    key_highlights = models.TextField(blank=True, default="")
    tomorrow_plan = models.TextField(blank=True, default="")
    challenges_faced = models.TextField(blank=True, default="")
    manager_remarks = models.TextField(blank=True, default="")
    productivity_score = models.IntegerField(default=0)
    submission_status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.SUBMITTED
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-report_date", "-created_at"]
        unique_together = ("employee", "report_date")

    def __str__(self):
        return f"EOD Report - {self.employee.email} - {self.report_date}"

    def save(self, *args, **kwargs):
        # Auto-calculate productivity score
        self.productivity_score = (
            (self.calls_done * 1) +
            (self.emails_sent * 1) +
            (self.followups_done * 2) +
            (self.meetings_fixed * 5) +
            (self.meetings_attended * 7) +
            (self.leads_generated * 10) +
            (self.demos_given * 10)
        )
        super().save(*args, **kwargs)



