#!/usr/bin/env python3
import sys
from collections import defaultdict

def parse_lcov(path):
    files = {}
    cur = None
    with open(path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if line.startswith('SF:'):
                cur = line[3:]
                files[cur] = {'da': {}, 'lf': 0, 'lh': 0}
            elif line.startswith('DA:') and cur is not None:
                parts = line[3:].split(',')
                ln = int(parts[0])
                cnt = int(parts[1])
                files[cur]['da'][ln] = cnt
            elif line.startswith('LF:') and cur is not None:
                files[cur]['lf'] = int(line[3:])
            elif line.startswith('LH:') and cur is not None:
                files[cur]['lh'] = int(line[3:])
            elif line == 'end_of_record':
                cur = None
    return files

def compress_lines(lines):
    if not lines:
        return ''
    lines = sorted(lines)
    ranges = []
    start = prev = lines[0]
    for n in lines[1:]:
        if n == prev + 1:
            prev = n
        else:
            if start == prev:
                ranges.append(str(start))
            else:
                ranges.append(f"{start}-{prev}")
            start = prev = n
    if start == prev:
        ranges.append(str(start))
    else:
        ranges.append(f"{start}-{prev}")
    return ','.join(ranges)

def main():
    path = 'coverage/lcov.info'
    if len(sys.argv) > 1:
        path = sys.argv[1]
    files = parse_lcov(path)
    stats = []
    for fname, data in files.items():
        da = data['da']
        missed = [ln for ln,c in da.items() if c == 0]
        # if DA missing, we could infer from LF/LH, but prefer explicit DA
        stats.append((fname, len(missed), data.get('lf',0), data.get('lh',0), missed))
    stats.sort(key=lambda x: x[1], reverse=True)
    top = stats[:10]
    print('Top 10 arquivos por linhas NÃO cobertas (por contagem)')
    print('arquivo,missed_count,total_lines,hit_lines,missed_line_ranges')
    for fname, missed_count, lf, lh, missed in top:
        ranges = compress_lines(missed)
        print(f'{fname},{missed_count},{lf},{lh},{ranges}')

if __name__ == '__main__':
    main()
