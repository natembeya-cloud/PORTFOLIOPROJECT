from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.conf import settings
from .models import Profile, Skill, Project, Experience, Education, ContactMessage, GalleryItem
from .forms import ContactForm, GalleryUploadForm
import json


def _base_context():
    """Common context shared across all pages."""
    profile = Profile.objects.first()
    return {'profile': profile, 'firebase_config': json.dumps(settings.FIREBASE_CONFIG)}


def home(request):
    ctx = _base_context()
    ctx['featured_projects'] = Project.objects.filter(featured=True)[:3]
    ctx['skills'] = Skill.objects.all()
    return render(request, 'core/home.html', ctx)


def about(request):
    ctx = _base_context()
    ctx['experiences'] = Experience.objects.all()
    ctx['education'] = Education.objects.all()
    ctx['skills'] = Skill.objects.all()
    return render(request, 'core/about.html', ctx)


def projects(request):
    ctx = _base_context()
    ctx['projects'] = Project.objects.all()
    return render(request, 'core/projects.html', ctx)


def gallery(request):
    ctx = _base_context()
    ctx['items'] = GalleryItem.objects.all()
    ctx['upload_form'] = GalleryUploadForm()
    return render(request, 'core/gallery.html', ctx)


def contact(request):
    ctx = _base_context()
    if request.method == 'POST':
        form = ContactForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'status': 'ok', 'message': "Message sent! I'll get back to you soon."})
            messages.success(request, "Message sent! I'll get back to you soon.")
            return redirect('contact')
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)
    else:
        form = ContactForm()
    ctx['form'] = form
    return render(request, 'core/contact.html', ctx)


@require_POST
def upload_gallery(request):
    form = GalleryUploadForm(request.POST, request.FILES)
    if form.is_valid():
        item = form.save()
        return JsonResponse({
            'status': 'ok',
            'id': item.id,
            'title': item.title,
            'image_url': item.image.url,
        })
    return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)


def resume(request):
    ctx = _base_context()
    ctx['experiences'] = Experience.objects.all()
    ctx['education'] = Education.objects.all()
    ctx['skills'] = Skill.objects.all()
    return render(request, 'core/resume.html', ctx)
