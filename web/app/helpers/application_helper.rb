module ApplicationHelper
  def nav_item(label, path, icon)
    link_to path, class: "nav__item", "aria-current": ("page" if current_page?(path)) do
      tag.span(class: "icon icon--#{icon}", "aria-hidden": true) + label
    end
  end

  def status_badge(status)
    tag.span(status.capitalize, class: "badge badge--#{status}")
  end

  # A column header that sorts the invitations table, exposing the current order through aria-sort.
  def sortable_header(label, key)
    active = @sort == key
    next_direction = active && @direction == "asc" ? "desc" : "asc"
    aria_sort = active ? (@direction == "asc" ? "ascending" : "descending") : "none"
    tag.th(scope: "col", "aria-sort": aria_sort) do
      link_to label, request.query_parameters.merge(sort: key, direction: next_direction)
    end
  end
end
