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

local escapeLuaString
do
  local matches =
  {
    ["^"] = "%^";
    ["$"] = "%$";
    ["("] = "%(";
    [")"] = "%)";
    ["%"] = "%%";
    ["."] = "%.";
    ["["] = "%[";
    ["]"] = "%]";
    ["*"] = "%*";
    ["+"] = "%+";
    ["-"] = "%-";
    ["?"] = "%?";
  }

  escapeLuaString = function(s)
    return (s:gsub(".", matches))
  end
end

local arrayContains = function(arr, predict)
  for i=1, #arr do
    if(predict(arr[i])) then
      return true
    end
  end
  return false
end

local splitByComma = function(s)
  local res = {}
  for c in string.gmatch(s, '([^,]+)') do
    table.insert(res, c)
  end
  return res
end

local wrap = function(f)
  local co = coroutine.create(f)
  coroutine.resume(co)
end
