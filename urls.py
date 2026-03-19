from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('projects/', views.projects, name='projects'),
    path('gallery/', views.gallery, name='gallery'),
    path('gallery/upload/', views.upload_gallery, name='upload_gallery'),
    path('contact/', views.contact, name='contact'),
    path('resume/', views.resume, name='resume'),
]
