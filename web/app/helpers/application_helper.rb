module ApplicationHelper
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
