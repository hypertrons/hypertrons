-- Copyright 2019 - present Xlab
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

function trim(input)
  return (string.gsub(input, "^%s*(.-)%s*$", "%1"))
end

function checkIfIssueOrPRExist(data, params)

  local number = tonumber(string.sub(params[2], 2))
  local arr
  
  if (#params == 2 or params[3] == "pull") then -- PR, default
    if (data.pulls == nil) then
      return false
    end
    arr = data.pulls
  elseif (params[3] == "issue") then -- issue
    if (data.issues == nil) then
      return false
    end
    arr = data.issues
  else
    return false
  end

  for i=1, #arr do
    if (arr[i].number == number) then
      return true
    end
  end

  return false
end

on('CommandEvent', function (e)
  if (e.command ~= compConfig.command) then
    return
  end

  if (#e.params ~= 2 and #e.params ~= 3) then
    return
  end

  local data = getData()
  if (data == nil) then -- data not ready yet
    return
  end

  if (checkIfIssueOrPRExist(data, e.params) == false) then
    return
  end

  local dataArray
  if (e.from == "issue" or e.from == "comment") then
    dataArray = data.issues
  elseif (e.from == "review" or e.from == "review_comment" or e.from == "pull_comment") then
    dataArray = data.pulls
  else
    return
  end

  for i= 1, #dataArray do
    local issue = dataArray[i]
    if (issue.number == e.number) then

      local needUpdate = false;
      local newBody = ""
      local curCheckListNum = 0

      for line in issue.body:gmatch("[^\r\n]+") do
        local trimLine = trim(line)
        if (string.match(trimLine, "- %[x%] ", 1) ~= nil) then
          curCheckListNum = curCheckListNum + 1
        elseif (string.match(trimLine, "- %[ %] ", 1) ~= nil) then
          curCheckListNum = curCheckListNum + 1
          if(curCheckListNum == tonumber(e.params[1])) then
            needUpdate = true
            line = (string.gsub(line, "- %[ %] ", "- [x] ", 1)) .. "(solved by " .. e.params[2] .. ")"
          end
        end
        newBody = newBody .. line .. "\r\n"
      end

      if (needUpdate == true) then
        local update = {}
        update["body"] = newBody
        if (e.from == "issue" or e.from == "comment") then
          updateIssue(e.number, update)
        elseif (e.from == "review" or e.from == "review_comment" or e.from == "pull_comment") then
          updatePull(e.number, update)
        end
      end

      return
    end
  end
end)
