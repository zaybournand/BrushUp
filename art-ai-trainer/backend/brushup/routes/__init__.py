"""Register API routes without changing their public URLs."""
def register_routes(app):
    from . import auth, drawings, community, uploads, generation
    for module in (auth, drawings, community, uploads, generation):
        app.register_blueprint(module.bp)
