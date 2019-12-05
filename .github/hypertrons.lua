-- Auto label on issue open
on('IssueEvent', function (e)
  if(e.action == 'opened') then
    local l = {}
    local labels = config['label-setup'].labels
    local title = string.lower(e.title)
    for i= 1, #labels do
      if(labels[i].keywords ~= nil and arrayContains(labels[i].keywords, function (keyword)
        return string.find(title, escapeLuaString(keyword)) ~= nil
      end)) then
        table.insert(l, labels[i].name)
      end
    end
    if(#l > 0) then
      log('Gonna add', #l, 'label(s) to', e.number)
      addLabels(e.number, l)
    end
  end
end)
