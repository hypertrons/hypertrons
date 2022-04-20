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

local arrayContainsItem = function(arr, item)
  return arrayContains(arr, function(i)
    return i == item
  end)
end

local arrayFilter = function(arr, filter)
  local out = {}
  for k, v in pairs(arr) do
    if filter(v, k, t) then table.insert(out, v) end
  end
  return out
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

--返回当前字符实际占用的字符数
local subStringGetByteCount = function(str, index)
    local curByte = string.byte(str, index)
    local byteCount = 1;
    if curByte == nil then
        byteCount = 0
    elseif curByte > 0 and curByte <= 127 then
        byteCount = 1
    elseif curByte>=192 and curByte<=223 then
        byteCount = 2
    elseif curByte>=224 and curByte<=239 then
        byteCount = 3
    elseif curByte>=240 and curByte<=247 then
        byteCount = 4
    end
    return byteCount;
end

--获取中英混合UTF8字符串的真实字符数量
local subStringGetTotalIndex = function(str)
    local curIndex = 0;
    local i = 1;
    local lastCount = 1;
    repeat 
        lastCount = subStringGetByteCount(str, i)
        i = i + lastCount;
        curIndex = curIndex + 1;
    until(lastCount == 0);
    return curIndex - 1;
end

local subStringGetTrueIndex = function(str, index)
    local curIndex = 0;
    local i = 1;
    local lastCount = 1;
    repeat 
        lastCount = subStringGetByteCount(str, i)
        i = i + lastCount;
        curIndex = curIndex + 1;
    until(curIndex >= index);
    return i - lastCount;
end

--截取中英混合的UTF8字符串，endIndex可缺省
local subStringUTF8 = function(str, startIndex, endIndex)
    if startIndex < 0 then
        startIndex = subStringGetTotalIndex(str) + startIndex + 1;
    end

    if endIndex ~= nil and endIndex < 0 then
        endIndex = subStringGetTotalIndex(str) + endIndex + 1;
    end

    if endIndex == nil then 
        return string.sub(str, subStringGetTrueIndex(str, startIndex));
    else
        return string.sub(str, subStringGetTrueIndex(str, startIndex), subStringGetTrueIndex(str, endIndex + 1) - 1);
    end
end

