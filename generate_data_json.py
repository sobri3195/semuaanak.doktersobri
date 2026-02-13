#!/usr/env/python
# json.py

data = ["hcfa", "lhfa", "wfa", "wfl"]
gender = ["boys", "girls"]

s = "{\n"
for g in gender:
    s += '\t "%s": {\n' % g
    for d in data:
        filename = "tables/%s_%s.txt" % (d,g)
        tmp = '\t\t "%s": {' % d
        i = 0
        for line in open(filename):
            if not(i):
                i = i+1
                continue
            ## format is Month, L, M, S, (SD) SDneg3, SDneg2, neg1, 0, 1, 2, 3
            ## so we dont consider 0..3
            start = 4 if d[0] == 'w' else 5
            l = line.split()
            if i != 1: tmp += ","
            tmp += "\"%s\": [" % l[0]
            for i in xrange(start,start+7):
                if i != start: tmp += ", "
                tmp += str(l[i])
            tmp += "]"
            i = i+1
        tmp += ' }'
        if d != data[-1]: tmp += ','
        tmp += '\n'
        s += tmp
    s += '\t }\n'
s += '}'
with open('data.json', 'w') as f:
    f.write(s)
