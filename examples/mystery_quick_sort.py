# foo is partition
# mystery is quicksort

def foo(array, low, high):
    pivot = array[high]
    i = low - 1
    for j in range(low, high):
        if array[j] <= pivot:
            i = i + 1
            (array[i], array[j]) = (array[j], array[i])
        (array[i + 1], array[high]) = (array[high], array[i + 1])
        return i + 1

def mystery(array, low, high):
    if low < high:
        pi = foo(array, low, high)
        mystery(array, low, pi - 1)
        mystery(array, pi + 1, high)
