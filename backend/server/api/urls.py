from django.urls import path
from .views import (
    upload_csv,
    analyze,
    get_graph,
    get_risk_scores,
    health,
    get_final_risk,
)

urlpatterns = [
    path("health/", health),
    path("upload-csv/", upload_csv),
    path("analyze/", analyze),
    path("graph/", get_graph),
    path("risk-scores/", get_risk_scores),
    path("final-risk/", get_final_risk),
]
