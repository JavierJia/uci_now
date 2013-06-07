from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
        url(r'^query/(?P<query>.*)/$','asterix_middleware.db.query'),
    # Examples:
    # url(r'^$', 'asterix_middleware.views.home', name='home'),
    # url(r'^asterix_middleware/', include('asterix_middleware.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
