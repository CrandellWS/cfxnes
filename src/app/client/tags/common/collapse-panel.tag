<collapse-panel class="panel panel-default">
  <div class="panel-heading">
    <h4 class="panel-title">
      <a href="#{ opts['panel-id'] }" data-parent="#{ parent.root.id }" data-toggle="collapse" onclick={ click }>
        <i class="icon icon-{ opts.icon }"></i>{ opts.label }
      </a>
    </h4>
  </div>
  <div id="{ opts['panel-id'] }" class="panel-collapse collapse">
    <div class="panel-body">
      <yield/>
    </div>
  </div>
  <script>
    click() {
      this.trigger('open');
    }
  </script>
</collapse-panel>
