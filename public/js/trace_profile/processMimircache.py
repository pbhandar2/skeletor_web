file_location = "../gpfs_trace/trcrpt.2017-12-03_22.58.57.1673.bison03fast0"

f = open(file_location, 'r')

line = f.readline()

while line:

	print line 

	line = f.readline()